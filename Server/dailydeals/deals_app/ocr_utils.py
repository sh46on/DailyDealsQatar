import pytesseract
from pdf2image import convert_from_path
import cv2
import numpy as np
import re
import json
import os
from dotenv import load_dotenv
from decimal import Decimal, ROUND_HALF_UP
from deals_app.models import Category, SubCategory

load_dotenv()

# -------------------------------
# 🤖 GEMINI SETUP
# -------------------------------
import google.generativeai as genai

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

AVAILABLE_MODELS = []
try:
    AVAILABLE_MODELS = [
        m.name for m in genai.list_models()
        if "generateContent" in m.supported_generation_methods
    ]
    print("✅ Gemini models:", AVAILABLE_MODELS)
except Exception as e:
    print("❌ Gemini init failed:", e)

# -------------------------------
# 🤖 OPENAI SETUP (fallback)
# -------------------------------
from openai import OpenAI
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# -------------------------------
# 🧹 IMAGE PREPROCESSING
# -------------------------------
def preprocess_image(pil_image):
    img = np.array(pil_image)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (5, 5), 0)

    thresh = cv2.adaptiveThreshold(
        blur, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        11, 2
    )
    return thresh

# -------------------------------
# 📄 PDF → IMAGES
# -------------------------------
def extract_images_from_pdf(pdf_path, max_pages=3):
    try:
        if not os.path.exists(pdf_path):
            print("❌ PDF not found:", pdf_path)
            return []

        poppler_path = os.getenv("POPPLER_PATH") or r"C:\poppler\Library\bin"

        images = convert_from_path(
            pdf_path,
            dpi=150,
            poppler_path=poppler_path
        )

        print(f"📄 Extracted {len(images)} pages")

        return images[:max_pages]

    except Exception as e:
        print("❌ PDF conversion failed:", str(e))
        return []
    
# -------------------------------
# 📄 OCR TEXT
# -------------------------------
def extract_text_from_pdf(pdf_path):
    images = extract_images_from_pdf(pdf_path)

    full_text = ""
    for img in images:
        processed = preprocess_image(img)
        text = pytesseract.image_to_string(processed, config="--psm 6")
        full_text += text + "\n"

    return full_text

# -------------------------------
# 🖼️ PREP IMAGES FOR GEMINI
# -------------------------------
def prepare_images_for_ai(images):
    prepared = []

    for img in images:
        try:
            img.thumbnail((1024, 1024))  # reduce size

            _, buffer = cv2.imencode(".jpg", np.array(img))
            prepared.append({
                "mime_type": "image/jpeg",
                "data": buffer.tobytes()
            })
        except:
            continue

    return prepared

# -------------------------------
# 🧠 SAFE JSON PARSER
# -------------------------------
def safe_parse(content):
    content = re.sub(r"```json|```", "", content).strip()
    try:
        return json.loads(content)
    except:
        import ast
        try:
            return ast.literal_eval(content)
        except:
            return []

# -------------------------------
# 🤖 GEMINI VISION (PRIMARY)
# -------------------------------
def extract_products_with_gemini_vision(images, text):
    if not AVAILABLE_MODELS:
        return []

    prepared_images = prepare_images_for_ai(images)

    prompt = f"""
Extract ALL products from this flyer.

Return ONLY JSON:

[
  {{
    "name": "...",
    "price": number,
    "old_price": number or null,
    "quantity": "...",
    "description": "...",
    "category": "...",
    "subcategory": "...",
    "image_hint": "short description of product image"
  }}
]

Rules:
- category = broad (e.g. Dairy, Snacks, Beverages)
- subcategory = more specific
- old_price only if discount exists
- description short and clean
- image_hint = describe product visually

TEXT:
{text}
"""

    for model_name in AVAILABLE_MODELS:
        try:
            print(f"🔄 Gemini Vision: {model_name}")

            model = genai.GenerativeModel(model_name)
            response = model.generate_content([prompt] + prepared_images)

            if not response.text:
                continue

            return safe_parse(response.text)

        except Exception as e:
            print("❌ Vision failed:", e)

    return []

# -------------------------------
# 🤖 GEMINI TEXT
# -------------------------------
def extract_products_with_gemini(text):
    if not AVAILABLE_MODELS:
        return []

    prompt = f"""
Extract product data.

Return JSON:
[
  {{
    "name": "...",
    "price": number
  }}
]

TEXT:
{text}
"""

    for model_name in AVAILABLE_MODELS:
        try:
            model = genai.GenerativeModel(model_name)
            response = model.generate_content(prompt)

            if not response.text:
                continue

            return safe_parse(response.text)

        except:
            continue

    return []

def get_or_create_category(category_name, subcategory_name):
    category = None
    subcategory = None

    if category_name:
        category, _ = Category.objects.get_or_create(
            name=category_name.strip()
        )

    if subcategory_name and category:
        subcategory, _ = SubCategory.objects.get_or_create(
            name=subcategory_name.strip(),
            category=category
        )

    return category, subcategory
# -------------------------------
# 🤖 OPENAI FALLBACK
# -------------------------------
def extract_products_with_openai(text):
    try:
        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Extract product data"},
                {"role": "user", "content": text}
            ]
        )

        return safe_parse(response.choices[0].message.content)

    except Exception as e:
        print("❌ OpenAI failed:", e)
        return []

# -------------------------------
# ⚡ REGEX LAST FALLBACK
# -------------------------------
def extract_products_with_regex(text):
    products = []
    lines = text.split("\n")

    for line in lines:
        match = re.search(r"(.+?)\s+(\d+[\.,]\d{2})", line)
        if match:
            try:
                price = Decimal(match.group(2).replace(",", ".")).quantize(
                    Decimal("0.01"), rounding=ROUND_HALF_UP
                )
                name = match.group(1).strip()

                if name and price > 0:
                    products.append({
                            "name": name,
                            "price": price,
                            "old_price": None,
                            "quantity": "",
                            "description": "",
                            "category": None,
                            "subcategory": None,
                        })
            except:
                continue

    return products

# -------------------------------
# 🧹 CLEAN PRODUCTS
# -------------------------------
def clean_products(products):
    cleaned = []

    for item in products:
        try:
            name = item.get("name")
            price = Decimal(str(item.get("price", 0))).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )

            if not name or price <= 0:
                continue

            cleaned.append({
                "name": name.strip(),
                "price": price,
                "old_price": item.get("old_price"),
                "quantity": item.get("quantity", ""),
                "description": item.get("description", ""),
                "category": item.get("category"),
                "subcategory": item.get("subcategory"),
            })

        except:
            continue

    return cleaned
# -------------------------------
# 🎯 MAIN PIPELINE
# -------------------------------
def process_flyer(pdf_path):
    images = extract_images_from_pdf(pdf_path)

    if not images:
        print("❌ No images extracted")
        return {"products": [], "images": []}

    # OCR (ONLY ONCE)
    text = ""
    for img in images:
        processed = preprocess_image(img)
        text += pytesseract.image_to_string(processed, config="--psm 6") + "\n"

    # 1️⃣ Gemini Vision
    products = extract_products_with_gemini_vision(images, text) or []
    if products:
        print("✅ Vision success")
        return {
            "products": clean_products(products),
            "images": images
        }

    # 2️⃣ Gemini text
    products = extract_products_with_gemini(text) or []
    if products:
        print("✅ Gemini text success")
        return {
            "products": clean_products(products),
            "images": images
        }

    # 3️⃣ OpenAI fallback
    products = extract_products_with_openai(text) or []
    if products:
        print("✅ OpenAI success")
        return {
            "products": clean_products(products),
            "images": images
        }

    # 4️⃣ Regex fallback
    print("⚠️ Regex fallback")
    return {
        "products": clean_products(extract_products_with_regex(text)),
        "images": images
    }