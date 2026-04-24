import os
import cv2
import numpy as np
from pdf2image import convert_from_path
import easyocr

reader = easyocr.Reader(['en'])  # OCR

def convert_pdf_to_images(pdf_path):
    images = convert_from_path(pdf_path, dpi=200)
    image_paths = []

    for i, img in enumerate(images):
        path = f"/tmp/page_{i}.jpg"
        img.save(path, "JPEG")
        image_paths.append(path)

    return image_paths


def extract_products_from_image(image_path):
    img = cv2.imread(image_path)

    # Simple detection (you can replace with YOLO later)
    h, w, _ = img.shape
    crop = img[int(h*0.2):int(h*0.8), int(w*0.1):int(w*0.9)]

    # OCR
    results = reader.readtext(crop)

    texts = [res[1] for res in results]

    products = []

    for text in texts:
        if "QAR" in text or "QR" in text:
            products.append({
                "name": text[:30],
                "price": text
            })

    return products


def process_flyer(pdf_path):
    images = convert_pdf_to_images(pdf_path)

    all_products = []

    for i, img_path in enumerate(images):
        products = extract_products_from_image(img_path)

        for p in products:
            p["page"] = i + 1

        all_products.extend(products)

    return all_products