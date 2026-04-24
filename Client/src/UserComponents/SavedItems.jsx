import { useState, useEffect } from "react";
import { fetchSavedItems, toggleSave } from "./api/userApi";
import UserLayout from "./UserLayout";
import {
  Bookmark, FileText, ShoppingCart,
  Trash2, Calendar, Grid, List, Heart, Package,
  Eye, ChevronRight, Store, Home, Utensils, 
  Heart as HealthIcon, Scissors, Shirt, Globe, 
  Tag, AlertCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Document, Page, pdfjs } from "react-pdf";
import FlyerModal from "./modal/FlyerModal";
import {API_URL} from "../api/api"

// PDF.js worker setup
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const BASE_URL = API_URL; // Update with your backend URL

export default function SavedItems() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [viewMode, setViewMode] = useState("grid");
  const [removingId, setRemovingId] = useState(null);
  const [pdfThumbnails, setPdfThumbnails] = useState({});
  const [selectedFlyer, setSelectedFlyer] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const res = await fetchSavedItems();
      const savedItems = res.data.data || [];
      setItems(savedItems);
      
      // Load PDF thumbnails for flyers
      savedItems.forEach(item => {
        if (item.flyer && item.flyer.pdf) {
          loadPdfThumbnail(item.id, item.flyer.pdf);
        }
      });
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const loadPdfThumbnail = async (itemId, pdfPath) => {
    try {
      const pdfUrl = pdfPath.startsWith('http') ? pdfPath : `${BASE_URL}${pdfPath}`;
      const pdf = await pdfjs.getDocument(pdfUrl).promise;
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 0.5 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise;
      
      setPdfThumbnails(prev => ({
        ...prev,
        [itemId]: canvas.toDataURL()
      }));
    } catch (error) {
      console.error('Error loading PDF thumbnail:', error);
    }
  };

  const handleRemove = async (item) => {
    setRemovingId(item.id);
    try {
      const payload = item.flyer
        ? { flyer_id: item.flyer.id }
        : { product_id: item.product.id };
      await toggleSave(payload);
    } catch (err) {
      console.error(err);
    }
    setTimeout(() => {
      setItems(prev => prev.filter(i => i.id !== item.id));
      setRemovingId(null);
    }, 400);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil(Math.abs(now - date) / 86400000);
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getCategoryIcon = (category) => {
    const icons = {
      supermarket: Store,
      home: Home,
      restaurant: Utensils,
      health: HealthIcon,
      beauty: Scissors,
      fashion: Shirt,
      online: Globe,
    };
    const IconComponent = icons[category] || Tag;
    return <IconComponent size={12} />;
  };

  const categoryMeta = {
    supermarket: { color: "#166534", bg: "#dcfce7", label: "Supermarket", icon: Store },
    home:        { color: "#0e7490", bg: "#cffafe", label: "Home", icon: Home },
    restaurant:  { color: "#9a3412", bg: "#ffedd5", label: "Restaurant", icon: Utensils },
    health:      { color: "#1d4ed8", bg: "#dbeafe", label: "Health", icon: HealthIcon },
    beauty:      { color: "#9d174d", bg: "#fce7f3", label: "Beauty", icon: Scissors },
    fashion:     { color: "#6d28d9", bg: "#ede9fe", label: "Fashion", icon: Shirt },
    default:     { color: "#7f1d1d", bg: "#ffe4e6", label: "Flyer", icon: Tag },
  };
  const getCatMeta = (cat) => categoryMeta[cat] || categoryMeta.default;

  const flyersCount   = items.filter(i => i.flyer).length;
  const productsCount = items.filter(i => i.product).length;

  const filtered = items.filter(item => {
    if (activeTab === "flyers")   return !!item.flyer;
    if (activeTab === "products") return !!item.product;
    return true;
  });

  const handleViewFlyer = (flyer) => {
    setSelectedFlyer(flyer);
  };

  if (loading) return (
    <UserLayout>
      <div className="si-loader">
        <div className="si-spinner" />
        <p>Loading your saved items...</p>
      </div>
      <Styles />
    </UserLayout>
  );

  return (
    <UserLayout>
      <div className="si-wrap">

        {/* Hero Section */}
        <header className="si-hero">
          <div className="si-hero-bg" />
          <div className="si-hero-inner">
            <div className="si-hero-icon">
              <Heart size={28} fill="#fff" stroke="#fff" />
            </div>
            <h1 className="si-hero-title">Saved Items</h1>
            <p className="si-hero-sub">Your collection of favorite flyers and products</p>
            <div className="si-stats">
              <div className="si-stat">
                <span className="si-stat-num">{items.length}</span>
                <span className="si-stat-label">Total</span>
              </div>
              <div className="si-stat-div" />
              <div className="si-stat">
                <span className="si-stat-num">{flyersCount}</span>
                <span className="si-stat-label">Flyers</span>
              </div>
              <div className="si-stat-div" />
              <div className="si-stat">
                <span className="si-stat-num">{productsCount}</span>
                <span className="si-stat-label">Products</span>
              </div>
            </div>
          </div>
        </header>

        {/* Controls */}
        <div className="si-controls">
          <div className="si-tabs">
            {[
              { key: "all",      label: "All",      icon: <Bookmark size={13} />,     count: items.length },
              { key: "flyers",   label: "Flyers",   icon: <FileText size={13} />,     count: flyersCount },
              { key: "products", label: "Products", icon: <ShoppingCart size={13} />, count: productsCount },
            ].map(t => (
              <button
                key={t.key}
                className={`si-tab ${activeTab === t.key ? "active" : ""}`}
                onClick={() => setActiveTab(t.key)}
              >
                {t.icon}
                <span className="si-tab-label">{t.label}</span>
                <span className="si-tab-pill">{t.count}</span>
              </button>
            ))}
          </div>

          <div className="si-view-toggle">
            <button className={`si-vbtn ${viewMode === "grid" ? "active" : ""}`} onClick={() => setViewMode("grid")} title="Grid view">
              <Grid size={15} />
            </button>
            <button className={`si-vbtn ${viewMode === "list" ? "active" : ""}`} onClick={() => setViewMode("list")} title="List view">
              <List size={15} />
            </button>
          </div>
        </div>

        {/* Items Grid/List */}
        {filtered.length === 0 ? (
          <div className="si-empty">
            <div className="si-empty-icon">
              <Heart size={48} strokeWidth={1.2} />
            </div>
            <h3>Your wishlist is empty</h3>
            <p>Start saving flyers and products you love</p>
            <button className="si-empty-btn" onClick={() => navigate("/user/home")}>
              Browse Deals
              <ChevronRight size={16} />
            </button>
          </div>
        ) : (
          <div className={`si-grid ${viewMode}`}>
            {filtered.map((item, idx) => {
              const isFlyer = !!item.flyer;
              const data = isFlyer ? item.flyer : item.product;
              const meta = getCatMeta(isFlyer ? data.category : "default");
              const removing = removingId === item.id;
              const pdfThumb = pdfThumbnails[item.id];
              const CategoryIcon = meta.icon;

              return (
                <article
                  key={item.id}
                  className={`si-card ${viewMode} ${removing ? "removing" : ""}`}
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  {/* Thumbnail with Image/PDF Preview */}
                  <div 
                    className="si-thumb"
                    onClick={() => isFlyer && handleViewFlyer(data)}
                  >
                    {isFlyer ? (
                      <div className="si-thumb-flyer" style={{ background: meta.bg }}>
                        {pdfThumb ? (
                          <img src={pdfThumb} alt={data.title} className="si-thumb-img" />
                        ) : (
                          <div className="si-pdf-placeholder">
                            <FileText size={48} strokeWidth={1} color={meta.color} />
                            <span>Loading preview...</span>
                          </div>
                        )}
                        <div className="si-thumb-overlay">
                          <Eye size={20} />
                          <span>View Flyer</span>
                        </div>
                      </div>
                    ) : (
                      <>
                        {data?.image ? (
                          <img 
                            src={data.image.startsWith('http') ? data.image : `${BASE_URL}${data.image}`} 
                            alt={data.name} 
                            className="si-thumb-img"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.parentElement.querySelector('.si-thumb-product').style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className="si-thumb-product" style={{ background: meta.bg, display: data?.image ? 'none' : 'flex' }}>
                          <Package size={48} strokeWidth={1} color={meta.color} />
                        </div>
                        <div className="si-thumb-overlay">
                          <Eye size={20} />
                          <span>View Product</span>
                        </div>
                      </>
                    )}
                    
                    {/* Category Badge */}
                    <span className="si-badge" style={{ background: meta.bg, color: meta.color }}>
                      <CategoryIcon size={10} />
                      {isFlyer ? meta.label : "Product"}
                    </span>
                  </div>

                  {/* Card Body */}
                  <div className="si-body">
                    <h3 className="si-card-title">{isFlyer ? data.title : data.name}</h3>
                    {!isFlyer && data?.price && (
                      <div className="si-price-wrapper">
                        <p className="si-price">₹{parseFloat(data.price).toLocaleString()}</p>
                        {data.old_price && (
                          <p className="si-old-price">₹{parseFloat(data.old_price).toLocaleString()}</p>
                        )}
                      </div>
                    )}
                    <div className="si-meta">
                      <Calendar size={12} />
                      <span>Saved {formatDate(item.created_at)}</span>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    className="si-remove"
                    onClick={() => handleRemove(item)}
                    title="Remove from saved"
                  >
                    <Trash2 size={16} />
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Flyer Modal */}
      {selectedFlyer && (
        <FlyerModal 
          flyer={selectedFlyer} 
          onClose={() => setSelectedFlyer(null)} 
        />
      )}

      <Styles />
    </UserLayout>
  );
}

function Styles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap');

      .si-wrap {
        min-height: 100vh;
        background: linear-gradient(135deg, #faf8f8 0%, #f5f3f0 100%);
        font-family: 'DM Sans', sans-serif;
        color: #1a0a0a;
      }

      /* Hero Section */
      .si-hero {
        position: relative;
        background: linear-gradient(135deg, #3d0000 0%, #7f1d1d 50%, #9b1c1c 100%);
        padding: 56px 24px 72px;
        overflow: hidden;
        text-align: center;
      }
      .si-hero-bg {
        position: absolute;
        inset: 0;
        background-image: 
          radial-gradient(circle at 20% 50%, rgba(255,255,255,0.08) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(255,200,200,0.1) 0%, transparent 40%);
        pointer-events: none;
      }
      .si-hero-bg::after {
        content: '';
        position: absolute;
        inset: 0;
        background: repeating-linear-gradient(
          45deg,
          transparent, transparent 40px,
          rgba(255,255,255,0.02) 40px, rgba(255,255,255,0.02) 41px
        );
      }
      .si-hero-inner {
        position: relative;
        z-index: 1;
        max-width: 640px;
        margin: 0 auto;
      }
      .si-hero-icon {
        width: 72px;
        height: 72px;
        margin: 0 auto 20px;
        background: rgba(255,255,255,0.15);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: float 3.5s ease-in-out infinite;
        border: 2px solid rgba(255,255,255,0.3);
        backdrop-filter: blur(8px);
      }
      @keyframes float {
        0%,100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
      }
      .si-hero-title {
        font-family: 'Playfair Display', Georgia, serif;
        font-size: clamp(32px, 6vw, 52px);
        font-weight: 800;
        color: #fff;
        margin: 0 0 12px;
        letter-spacing: -0.02em;
        text-shadow: 0 2px 20px rgba(0,0,0,0.3);
      }
      .si-hero-sub {
        font-size: 15px;
        color: rgba(255,255,255,0.75);
        margin: 0 0 32px;
      }
      .si-stats {
        display: inline-flex;
        align-items: center;
        background: rgba(255,255,255,0.12);
        border: 1px solid rgba(255,255,255,0.2);
        backdrop-filter: blur(12px);
        border-radius: 60px;
        padding: 16px 32px;
        gap: 24px;
      }
      .si-stat {
        text-align: center;
      }
      .si-stat-num {
        display: block;
        font-size: 24px;
        font-weight: 800;
        color: #fff;
        font-family: 'Playfair Display', serif;
        line-height: 1;
      }
      .si-stat-label {
        font-size: 11px;
        color: rgba(255,255,255,0.7);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        margin-top: 4px;
      }
      .si-stat-div {
        width: 1px;
        height: 40px;
        background: rgba(255,255,255,0.2);
      }

      /* Controls */
      .si-controls {
        max-width: 1200px;
        margin: -30px auto 0;
        padding: 0 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
        flex-wrap: wrap;
        position: relative;
        z-index: 10;
      }
      .si-tabs {
        display: flex;
        gap: 8px;
        background: #fff;
        border-radius: 60px;
        padding: 6px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      }
      .si-tab {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 22px;
        border: none;
        background: transparent;
        border-radius: 50px;
        font-size: 14px;
        font-weight: 600;
        color: #6b7280;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .si-tab:hover {
        color: #7f1d1d;
        background: #fef2f2;
      }
      .si-tab.active {
        background: #7f1d1d;
        color: #fff;
        box-shadow: 0 4px 12px rgba(127,29,29,0.4);
      }
      .si-tab-pill {
        background: rgba(0,0,0,0.08);
        padding: 2px 8px;
        border-radius: 20px;
        font-size: 11px;
        font-weight: 700;
      }
      .si-tab.active .si-tab-pill {
        background: rgba(255,255,255,0.25);
      }
      .si-view-toggle {
        display: flex;
        gap: 6px;
        background: #fff;
        border-radius: 12px;
        padding: 6px;
        box-shadow: 0 2px 12px rgba(0,0,0,0.08);
      }
      .si-vbtn {
        padding: 8px 12px;
        border: none;
        background: transparent;
        border-radius: 8px;
        cursor: pointer;
        color: #9ca3af;
        transition: all 0.2s;
        display: flex;
        align-items: center;
      }
      .si-vbtn:hover {
        background: #fef2f2;
        color: #7f1d1d;
      }
      .si-vbtn.active {
        background: #7f1d1d;
        color: #fff;
      }

      /* Grid Layout */
      .si-grid {
        max-width: 1200px;
        margin: 40px auto 60px;
        padding: 0 20px;
      }
      .si-grid.grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 24px;
      }
      .si-grid.list {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      /* Card Styles */
      .si-card {
        position: relative;
        background: #fff;
        border-radius: 20px;
        overflow: hidden;
        box-shadow: 0 2px 12px rgba(0,0,0,0.06);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        animation: cardIn 0.45s cubic-bezier(0.2, 0.9, 0.4, 1.1) both;
      }
      @keyframes cardIn {
        from {
          opacity: 0;
          transform: translateY(24px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .si-card:hover {
        transform: translateY(-6px);
        box-shadow: 0 20px 40px rgba(127,29,29,0.15);
      }
      .si-card.removing {
        animation: cardOut 0.4s ease-out forwards;
      }
      @keyframes cardOut {
        to {
          opacity: 0;
          transform: scale(0.95) translateY(10px);
        }
      }

      /* List Card Layout */
      .si-card.list {
        display: flex;
        flex-direction: row;
        align-items: stretch;
        border-radius: 16px;
      }
      .si-card.list .si-thumb {
        width: 140px;
        min-width: 140px;
        height: auto;
        min-height: 140px;
        border-radius: 0;
        flex-shrink: 0;
        cursor: pointer;
      }
      .si-card.list .si-body {
        flex: 1;
        padding: 20px 60px 20px 24px;
        display: flex;
        flex-direction: column;
        justify-content: center;
      }
      .si-card.list .si-thumb-overlay {
        border-radius: 0;
      }

      /* Thumbnail */
      .si-thumb {
        position: relative;
        height: 220px;
        overflow: hidden;
        background: #f9f9f9;
        cursor: pointer;
      }
      .si-thumb-flyer, .si-thumb-product {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.4s ease;
      }
      .si-thumb-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .si-card:hover .si-thumb-img {
        transform: scale(1.08);
      }
      .si-pdf-placeholder {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 12px;
      }
      .si-pdf-placeholder span {
        font-size: 11px;
        color: #6b7280;
      }
      .si-thumb-overlay {
        position: absolute;
        inset: 0;
        background: rgba(0,0,0,0.6);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 8px;
        opacity: 0;
        transition: opacity 0.3s ease;
        color: white;
      }
      .si-card:hover .si-thumb-overlay {
        opacity: 1;
      }
      .si-thumb-overlay span {
        font-size: 13px;
        font-weight: 600;
      }

      /* Badge */
      .si-badge {
        position: absolute;
        top: 12px;
        left: 12px;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 5px 12px;
        border-radius: 20px;
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        z-index: 2;
        backdrop-filter: blur(8px);
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }

      /* Card Body */
      .si-body {
        padding: 16px 48px 16px 18px;
      }
      .si-card-title {
        font-size: 15px;
        font-weight: 700;
        color: #1a0a0a;
        margin: 0 0 8px;
        line-height: 1.4;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .si-price-wrapper {
        display: flex;
        align-items: baseline;
        gap: 8px;
        margin-bottom: 8px;
        flex-wrap: wrap;
      }
      .si-price {
        font-size: 18px;
        font-weight: 800;
        color: #7f1d1d;
        margin: 0;
        font-family: 'Playfair Display', serif;
      }
      .si-old-price {
        font-size: 13px;
        color: #9ca3af;
        text-decoration: line-through;
        margin: 0;
      }
      .si-meta {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 11px;
        color: #9ca3af;
        margin: 0;
      }

      /* Remove Button */
      .si-remove {
        position: absolute;
        top: 12px;
        right: 12px;
        width: 34px;
        height: 34px;
        border-radius: 10px;
        border: none;
        background: rgba(255,255,255,0.95);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: #9ca3af;
        transition: all 0.2s;
        z-index: 3;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }
      .si-remove:hover {
        background: #fee2e2;
        color: #dc2626;
        transform: scale(1.1);
      }

      /* Empty State */
      .si-empty {
        text-align: center;
        padding: 80px 24px;
        max-width: 480px;
        margin: 0 auto;
      }
      .si-empty-icon {
        width: 120px;
        height: 120px;
        margin: 0 auto 24px;
        background: #fff;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #e5c0c0;
        box-shadow: 0 8px 24px rgba(0,0,0,0.08);
      }
      .si-empty h3 {
        font-family: 'Playfair Display', serif;
        font-size: 24px;
        color: #1a0a0a;
        margin: 0 0 12px;
      }
      .si-empty p {
        font-size: 15px;
        color: #6b7280;
        margin: 0 0 28px;
      }
      .si-empty-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 14px 32px;
        background: #7f1d1d;
        color: #fff;
        border: none;
        border-radius: 40px;
        font-size: 15px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      }
      .si-empty-btn:hover {
        background: #3d0000;
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(127,29,29,0.4);
      }

      /* Loader */
      .si-loader {
        min-height: 60vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 20px;
      }
      .si-spinner {
        width: 48px;
        height: 48px;
        border: 3px solid #f3f4f6;
        border-top-color: #7f1d1d;
        border-radius: 50%;
        animation: spin 0.75s linear infinite;
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      .si-loader p {
        font-size: 14px;
        color: #9ca3af;
      }

      /* Responsive Design */
      @media (max-width: 768px) {
        .si-hero {
          padding: 40px 16px 60px;
        }
        .si-stats {
          padding: 12px 24px;
          gap: 20px;
        }
        .si-controls {
          flex-direction: column;
          align-items: stretch;
          margin-top: -25px;
        }
        .si-tabs {
          justify-content: center;
        }
        .si-view-toggle {
          align-self: center;
        }
        .si-grid.grid {
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 16px;
        }
        .si-card.list .si-thumb {
          width: 110px;
          min-width: 110px;
        }
      }

      @media (max-width: 480px) {
        .si-tab-label {
          display: none;
        }
        .si-tab {
          padding: 10px 16px;
        }
        .si-hero-icon {
          width: 60px;
          height: 60px;
        }
        .si-stats {
          flex-wrap: wrap;
          justify-content: center;
          gap: 16px;
        }
        .si-stat-div {
          display: none;
        }
        .si-grid.grid {
          grid-template-columns: 1fr;
          gap: 16px;
        }
        .si-thumb {
          height: 200px;
        }
        .si-card.list {
          flex-direction: column;
        }
        .si-card.list .si-thumb {
          width: 100%;
          height: 180px;
        }
        .si-card.list .si-body {
          padding: 16px;
        }
      }
    `}</style>
  );
}