import { useState, useEffect } from "react";
import { supabase } from "./supabase";

const ADMIN_EMAILS = ["cirotonini30@gmail.com", "piligramaglia2@gmail.com"];
const APP_NAME = "Gulita";
const SERVICE_FEE = 500;

const C = {
  primary: "#cc1f1f",
  primaryDark: "#a81515",
  primaryLight: "#e63030",
  accent: "#e8a020",
  bg: "#1a0505",
  card: "#2a0a0a",
  border: "#4a1515",
};

const S = {
  input: {
    padding: "10px 14px", background: "#2a0a0a", border: "1px solid #4a1515",
    borderRadius: 10, color: "#f1f5f9", fontSize: 14,
    fontFamily: "'Nunito', sans-serif", outline: "none",
    width: "100%", boxSizing: "border-box",
  },
  btnSmall: (bg) => ({
    background: bg, border: "none", borderRadius: 8, width: 30, height: 30,
    color: "#fff", cursor: "pointer", fontWeight: 800, fontSize: 16,
    display: "flex", alignItems: "center", justifyContent: "center",
  }),
  btn: (bg) => ({
    background: bg, border: "none", borderRadius: 10, padding: "8px 16px",
    color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 13,
    fontFamily: "'Nunito', sans-serif",
  }),
  card: {
    background: "#2a0a0a", borderRadius: 16, padding: 18,
    marginBottom: 14, border: "1px solid #4a1515",
  },
  label: {
    fontSize: 12, color: "#94a3b8", fontWeight: 700,
    textTransform: "uppercase", letterSpacing: 1,
    display: "block", marginBottom: 6,
  },
};

const Logo = ({ size = 36 }) => (
  <img src="/logo.png" alt={APP_NAME} style={{ width: size, height: size, objectFit: "contain", borderRadius: 8 }} />
);

const fp = (n) => `$${Number(n).toLocaleString("es-AR")}`;

const STATUS_CONFIG = {
  pending:    { label: "Esperando confirmación", color: "#e8a020", icon: "⏳" },
  accepted:   { label: "Pedido confirmado",       color: "#3b82f6", icon: "✅" },
  preparing:  { label: "En preparación",          color: "#8b5cf6", icon: "👨‍🍳" },
  ready:      { label: "Listo para retirar",      color: "#06b6d4", icon: "📦" },
  picked:     { label: "Repartidor en camino",    color: "#cc1f1f", icon: "🛵" },
  delivering: { label: "En camino a tu casa",     color: "#cc1f1f", icon: "📍" },
  delivered:  { label: "¡Entregado!",             color: "#10b981", icon: "🎉" },
  rejected:   { label: "Rechazado",               color: "#ef4444", icon: "❌" },
  cancelled:  { label: "Cancelado",               color: "#64748b", icon: "🚫" },
};

function Badge({ status }) {
  const c = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span style={{ background: c.color + "22", color: c.color, border: `1px solid ${c.color}44`, borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}>
      {c.icon} {c.label}
    </span>
  );
}

function ProgressBar({ status }) {
  const steps = ["accepted", "preparing", "ready", "picked", "delivered"];
  const idx = steps.indexOf(status);
  const pct = status === "pending" ? 0 : Math.round(((idx + 1) / steps.length) * 100);
  return (
    <div style={{ margin: "12px 0" }}>
      <div style={{ height: 8, background: "#1a0505", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: `linear-gradient(90deg,#a81515,#e63030)`, borderRadius: 4, transition: "width 0.6s ease" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
        {["✅","👨‍🍳","📦","🛵","🎉"].map((icon, i) => (
          <span key={i} style={{ fontSize: 18, opacity: i <= idx ? 1 : 0.25 }}>{icon}</span>
        ))}
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
      <div style={{ width: 36, height: 36, border: "3px solid #4a1515", borderTop: "3px solid #cc1f1f", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    </div>
  );
}

function SaveMsg({ msg }) {
  if (!msg) return null;
  const ok = msg.startsWith("✅");
  return (
    <div style={{ background: ok ? "#10b98122" : "#ef444422", border: `1px solid ${ok ? "#10b981" : "#ef4444"}`, borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: ok ? "#10b981" : "#ef4444" }}>{msg}</div>
  );
}

// ─────────────────────────────────────────────
// WHATSAPP
// ─────────────────────────────────────────────
const waLink = (phone, msg) => {
  const clean = (phone || "").replace(/\D/g, "");
  const number = clean.startsWith("54") ? clean : `54${clean}`;
  return `https://wa.me/${number}?text=${encodeURIComponent(msg)}`;
};

const WaButton = ({ phone, msg, label = "💬 WhatsApp" }) => {
  if (!phone) return null;
  return (
    <a href={waLink(phone, msg)} target="_blank" rel="noopener noreferrer"
      style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#25d366", border: "none", borderRadius: 10, padding: "8px 14px", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 13, fontFamily: "'Nunito', sans-serif", textDecoration: "none" }}>
      {label}
    </a>
  );
};

// ─────────────────────────────────────────────
// MODAL CONFIRMACION
// ─────────────────────────────────────────────
function ConfirmModal({ title, message, onConfirm, onCancel, confirmLabel = "Confirmar", confirmColor = C.primary }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: C.card, borderRadius: 20, padding: 28, width: "100%", maxWidth: 360, border: `1px solid ${C.border}` }}>
        <div style={{ fontWeight: 900, fontSize: 20, marginBottom: 12, color: "#f1f5f9" }}>{title}</div>
        <div style={{ fontSize: 14, color: "#94a3b8", marginBottom: 24, lineHeight: 1.6 }}>{message}</div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: 14, borderRadius: 12, border: `1px solid ${C.border}`, background: "transparent", color: "#94a3b8", fontWeight: 700, cursor: "pointer", fontFamily: "'Nunito', sans-serif", fontSize: 14 }}>
            Cancelar
          </button>
          <button onClick={onConfirm} style={{ flex: 1, padding: 14, borderRadius: 12, border: "none", background: `linear-gradient(135deg,${confirmColor},${confirmColor}cc)`, color: "#fff", fontWeight: 900, cursor: "pointer", fontFamily: "'Nunito', sans-serif", fontSize: 14 }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────
function AuthScreen() {
  const [mode, setMode] = useState("login");
  const [role, setRole] = useState("client");
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError(""); setLoading(true);
    try {
      if (mode === "register") {
        if (!form.phone.trim()) throw new Error("El teléfono es obligatorio");
        const { error: e } = await supabase.auth.signUp({
          email: form.email, password: form.password,
          options: { data: { name: form.name, phone: form.phone, role } }
        });
        if (e) throw e;
        setError("✅ Cuenta creada. Podés iniciar sesión.");
        setMode("login");
      } else {
        const { error: e } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
        if (e) throw e;
      }
    } catch (e) { setError(e.message || "Error al procesar"); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'Nunito', sans-serif" }}>
      <div style={{ animation: "float 3s ease-in-out infinite", marginBottom: 12 }}><Logo size={90} /></div>
      <div style={{ fontSize: 36, fontWeight: 900, color: "#f1f5f9", letterSpacing: -1 }}>{APP_NAME}</div>
      <div style={{ color: "#64748b", fontSize: 14, marginTop: 4, marginBottom: 32 }}>Tu comida favorita, en tu puerta</div>
      <div style={{ width: "100%", maxWidth: 380, background: C.card, borderRadius: 24, padding: 28, border: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", marginBottom: 24, background: "#1a0505", borderRadius: 12, padding: 4 }}>
          {[["login","Iniciar sesión"],["register","Registrarse"]].map(([key, label]) => (
            <button key={key} onClick={() => { setMode(key); setError(""); }} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", background: mode === key ? C.primary : "transparent", color: mode === key ? "#fff" : "#64748b", fontWeight: 800, cursor: "pointer", fontSize: 14, fontFamily: "'Nunito', sans-serif" }}>{label}</button>
          ))}
        </div>
        {mode === "register" && (
          <>
            <label style={S.label}>Nombre completo</label>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Juan García" style={{ ...S.input, marginBottom: 14 }} />
            <label style={S.label}>Teléfono <span style={{ color: C.primary }}>*</span></label>
            <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+54 11 1234-5678" style={{ ...S.input, marginBottom: 14 }} />
            <label style={S.label}>Soy...</label>
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              {[["client","👤 Cliente"],["restaurant","🍽️ Restaurante"],["delivery","🛵 Repartidor"]].map(([key, label]) => (
                <button key={key} onClick={() => setRole(key)} style={{ flex: 1, padding: "10px 4px", borderRadius: 10, background: role === key ? C.primary + "22" : "#1a0505", color: role === key ? C.primary : "#64748b", border: role === key ? `2px solid ${C.primary}` : `1px solid ${C.border}`, fontWeight: 700, cursor: "pointer", fontSize: 11, fontFamily: "'Nunito', sans-serif" }}>{label}</button>
              ))}
            </div>
          </>
        )}
        <label style={S.label}>Email</label>
        <input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="tu@email.com" type="email" style={{ ...S.input, marginBottom: 14 }} />
        <label style={S.label}>Contraseña</label>
        <input value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="••••••••" type="password" style={{ ...S.input, marginBottom: 20 }} onKeyDown={e => e.key === "Enter" && handleSubmit()} />
        {error && <SaveMsg msg={error} />}
        <button onClick={handleSubmit} disabled={loading} style={{ width: "100%", background: loading ? C.border : `linear-gradient(135deg,${C.primary},${C.primaryDark})`, border: "none", borderRadius: 14, padding: 16, color: "#fff", fontWeight: 900, fontSize: 16, cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Nunito', sans-serif" }}>
          {loading ? "Cargando..." : mode === "login" ? "Entrar" : "Crear cuenta"}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// CLIENT
// ─────────────────────────────────────────────
function ClientView({ user, profile: initialProfile, onLogout }) {
  const [profile, setProfile] = useState(initialProfile);
  const [screen, setScreen] = useState("home");
  const [restaurants, setRestaurants] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedRest, setSelectedRest] = useState(null);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [trackOrder, setTrackOrder] = useState(null);
  const [address, setAddress] = useState(initialProfile?.address || "");
  const [payMethod, setPayMethod] = useState("Efectivo");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [profileForm, setProfileForm] = useState({ name: initialProfile?.name || "", phone: initialProfile?.phone || "", address: initialProfile?.address || "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");
  const [showConfirmOrder, setShowConfirmOrder] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const saveProfile = async () => {
    setSavingProfile(true);
    const updates = { name: profileForm.name, phone: profileForm.phone, address: profileForm.address };
    const { error } = await supabase.from("profiles").update(updates).eq("id", user.id);
    if (error) setProfileMsg("❌ Error: " + error.message);
    else { setProfile(p => ({ ...p, ...updates })); setAddress(profileForm.address); setProfileMsg("✅ Perfil actualizado"); }
    setSavingProfile(false);
    setTimeout(() => setProfileMsg(""), 3000);
  };

  useEffect(() => {
    supabase.from("restaurants").select("*").eq("active", true).eq("approved", true)
      .then(({ data }) => { setRestaurants(data || []); setLoading(false); });
  }, []);

  useEffect(() => {
    supabase.from("orders").select("*").eq("client_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => setOrders(data || []));
    const channel = supabase.channel("client-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `client_id=eq.${user.id}` },
        (payload) => {
          setOrders(prev => {
            const exists = prev.find(o => o.id === payload.new.id);
            if (exists) return prev.map(o => o.id === payload.new.id ? payload.new : o);
            return [payload.new, ...prev];
          });
          if (trackOrder?.id === payload.new.id) setTrackOrder(payload.new);
        }
      ).subscribe();
    return () => supabase.removeChannel(channel);
  }, [user.id]);

  const loadMenu = async (rest) => {
    const { data } = await supabase.from("menu_items").select("*").eq("restaurant_id", rest.id).eq("available", true);
    setMenuItems(data || []); setSelectedRest(rest); setScreen("menu");
  };

  const addToCart = (item) => setCart(prev => {
    const ex = prev.find(c => c.id === item.id);
    if (ex) return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
    return [...prev, { ...item, qty: 1 }];
  });

  const removeFromCart = (id) => setCart(prev => {
    const ex = prev.find(c => c.id === id);
    if (ex?.qty === 1) return prev.filter(c => c.id !== id);
    return prev.map(c => c.id === id ? { ...c, qty: c.qty - 1 } : c);
  });

  const placeOrder = async () => {
    if (!address.trim()) { alert("Ingresá tu dirección"); return; }
    const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const { data: restProfile } = await supabase
      .from("profiles").select("phone").eq("id", selectedRest.owner_id).single();
    const { data, error } = await supabase.from("orders").insert({
      client_id: user.id, restaurant_id: selectedRest.id,
      items: cart.map(c => ({ id: c.id, name: c.name, qty: c.qty, price: c.price })),
      total: cartTotal, delivery_fee: SERVICE_FEE, address, pay_method: payMethod, status: "pending",
      client_phone: profile?.phone,
      restaurant_phone: restProfile?.phone,
    }).select().single();
    if (error) { alert("Error al crear pedido: " + error.message); return; }
    setShowConfirmOrder(false);
    setTrackOrder(data); setCart([]); setScreen("tracking");
  };

  const cancelOrder = async () => {
    if (!trackOrder) return;
    await supabase.from("orders").update({ status: "cancelled" }).eq("id", trackOrder.id);
    setShowCancelConfirm(false);
    setScreen("home");
  };

  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const activeOrders = orders.filter(o => !["delivered","rejected","cancelled"].includes(o.status));
  const filtered = restaurants.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ fontFamily: "'Nunito', sans-serif", color: "#f1f5f9", minHeight: "100%", background: C.bg }}>

      {/* MODAL CONFIRMAR PEDIDO */}
      {showConfirmOrder && (
        <ConfirmModal
          title="¿Confirmar pedido?"
          message={
            <div>
              <div style={{ marginBottom: 12 }}>
                {cart.map((item, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 13 }}>
                    <span>x{item.qty} {item.name}</span>
                    <span style={{ color: C.primary, fontWeight: 700 }}>{fp(item.price * item.qty)}</span>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                  <span>Subtotal</span><span>{fp(cartTotal)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 8 }}>
                  <span>Cargo por servicio</span><span>{fp(SERVICE_FEE)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 900, fontSize: 16 }}>
                  <span>Total</span><span style={{ color: C.primary }}>{fp(cartTotal + SERVICE_FEE)}</span>
                </div>
              </div>
              <div style={{ marginTop: 12, fontSize: 12, color: "#64748b" }}>📍 {address} · 💳 {payMethod}</div>
            </div>
          }
          confirmLabel={`Pedir — ${fp(cartTotal + SERVICE_FEE)}`}
          onConfirm={placeOrder}
          onCancel={() => setShowConfirmOrder(false)}
        />
      )}

      {/* MODAL CANCELAR PEDIDO */}
      {showCancelConfirm && (
        <ConfirmModal
          title="¿Cancelar pedido?"
          message="Solo podés cancelar antes de que el restaurante confirme. Si ya fue aceptado, contactalos por WhatsApp."
          confirmLabel="Sí, cancelar"
          confirmColor="#ef4444"
          onConfirm={cancelOrder}
          onCancel={() => setShowCancelConfirm(false)}
        />
      )}

      {/* HEADER */}
      <div style={{ background: `linear-gradient(135deg,${C.primary},${C.primaryDark})`, padding: "16px 20px", position: "sticky", top: 0, zIndex: 50, boxShadow: `0 4px 20px ${C.primary}66` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {screen !== "home" && screen !== "profile" && (
              <button onClick={() => screen === "cart" ? setScreen("menu") : setScreen("home")} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", borderRadius: "50%", width: 34, height: 34, cursor: "pointer", fontSize: 18 }}>←</button>
            )}
            {screen === "profile" && (
              <button onClick={() => setScreen("home")} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", borderRadius: "50%", width: 34, height: 34, cursor: "pointer", fontSize: 18 }}>←</button>
            )}
            <Logo size={32} />
            <div>
              <div style={{ fontWeight: 900, fontSize: 20 }}>{APP_NAME}</div>
              <div style={{ fontSize: 12, opacity: 0.85 }}>👤 {profile?.name}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {cart.length > 0 && (
              <button onClick={() => setScreen("cart")} style={{ background: "#fff", color: C.primary, border: "none", borderRadius: 20, padding: "6px 14px", fontWeight: 800, cursor: "pointer", fontSize: 14 }}>
                🛒 {cart.reduce((s, c) => s + c.qty, 0)}
              </button>
            )}
            {screen !== "profile" && (
              <button onClick={() => setScreen("profile")} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", borderRadius: 20, padding: "6px 10px", cursor: "pointer", fontSize: 15 }}>⚙️</button>
            )}
            <button onClick={onLogout} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", borderRadius: 20, padding: "6px 12px", cursor: "pointer", fontSize: 13, fontFamily: "'Nunito', sans-serif" }}>Salir</button>
          </div>
        </div>
      </div>

      <div style={{ padding: 16, maxWidth: 600, margin: "0 auto", paddingBottom: 90 }}>

        {/* PERFIL CLIENTE */}
        {screen === "profile" && (
          <>
            <div style={{ fontWeight: 900, fontSize: 20, marginBottom: 16, marginTop: 4 }}>⚙️ Mi perfil</div>
            <div style={S.card}>
              <label style={S.label}>Nombre</label>
              <input value={profileForm.name} onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))} style={{ ...S.input, marginBottom: 14 }} />
              <label style={S.label}>Teléfono</label>
              <input value={profileForm.phone} onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))} placeholder="+54 11 1234-5678" style={{ ...S.input, marginBottom: 14 }} />
              <label style={S.label}>Dirección habitual</label>
              <input value={profileForm.address} onChange={e => setProfileForm(p => ({ ...p, address: e.target.value }))} placeholder="Ej: San Martín 456" style={{ ...S.input, marginBottom: 20 }} />
              <SaveMsg msg={profileMsg} />
              <button onClick={saveProfile} disabled={savingProfile} style={{ width: "100%", background: savingProfile ? C.border : `linear-gradient(135deg,${C.primary},${C.primaryDark})`, border: "none", borderRadius: 12, padding: 14, color: "#fff", fontWeight: 900, fontSize: 15, cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>
                {savingProfile ? "Guardando..." : "💾 Guardar cambios"}
              </button>
            </div>
          </>
        )}

        {/* HOME */}
        {screen === "home" && (
          <>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍  Buscar restaurante o categoría..." style={{ ...S.input, margin: "16px 0", padding: "12px 16px", borderRadius: 14, fontSize: 15 }} />
            {activeOrders.map(o => (
              <div key={o.id} onClick={() => { setTrackOrder(o); setScreen("tracking"); }} style={{ background: `linear-gradient(135deg,${C.card},${C.bg})`, border: `1px solid ${C.primary}`, borderRadius: 16, padding: 14, marginBottom: 16, cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div><div style={{ fontWeight: 800, color: C.primary }}>Pedido activo</div><div style={{ fontSize: 13, color: "#94a3b8", marginTop: 2 }}>{o.id}</div></div>
                  <Badge status={o.status} />
                </div>
                <ProgressBar status={o.status} />
              </div>
            ))}
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8, marginBottom: 16 }}>
              {["🍕 Pizzas","🥩 Parrilla","🍣 Japonesa","🍔 Burgers","🥗 Saludable"].map(cat => (
                <button key={cat} onClick={() => setSearch(cat.split(" ")[1])} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: "8px 16px", color: "#94a3b8", cursor: "pointer", whiteSpace: "nowrap", fontSize: 13, fontFamily: "'Nunito', sans-serif" }}>{cat}</button>
              ))}
            </div>
            {loading ? <Spinner /> : filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: "#475569" }}><Logo size={60} /><div style={{ marginTop: 12 }}>No hay restaurantes disponibles aún</div></div>
            ) : filtered.map(rest => (
              <div key={rest.id} onClick={() => loadMenu(rest)} style={{ background: C.card, borderRadius: 18, marginBottom: 14, cursor: "pointer", overflow: "hidden", border: `1px solid ${C.border}` }}>
                <div style={{ background: `linear-gradient(135deg,#3a1010,${C.card})`, height: 100, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                  {rest.photo_url
                    ? <img src={rest.photo_url} alt={rest.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <div style={{ fontSize: 52 }}>{rest.image}</div>
                  }
                </div>
                <div style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div><div style={{ fontWeight: 800, fontSize: 17 }}>{rest.name}</div><div style={{ fontSize: 13, color: "#94a3b8" }}>{rest.category}</div></div>
                    <div style={{ textAlign: "right" }}><div style={{ color: C.accent, fontWeight: 700 }}>⭐ {rest.rating}</div><div style={{ fontSize: 12, color: "#64748b" }}>{rest.delivery_time}</div></div>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {/* MENU */}
        {screen === "menu" && selectedRest && (
          <>
            <div style={{ background: `linear-gradient(135deg,#3a1010,${C.bg})`, borderRadius: 18, marginBottom: 16, overflow: "hidden" }}>
              <div style={{ height: 120, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                {selectedRest.photo_url
                  ? <img src={selectedRest.photo_url} alt={selectedRest.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <div style={{ fontSize: 60 }}>{selectedRest.image}</div>
                }
              </div>
              <div style={{ padding: "14px 20px", textAlign: "center" }}>
                <div style={{ fontWeight: 900, fontSize: 22 }}>{selectedRest.name}</div>
                <div style={{ color: "#94a3b8", fontSize: 13, marginTop: 4 }}>⭐ {selectedRest.rating} · {selectedRest.delivery_time} · Cargo de servicio {fp(SERVICE_FEE)}</div>
              </div>
            </div>
            {menuItems.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: "#475569" }}><Logo size={48} /><div style={{ marginTop: 12 }}>Este restaurante aún no cargó su menú</div></div>
            ) : menuItems.map(item => {
              const inCart = cart.find(c => c.id === item.id);
              return (
                <div key={item.id} style={{ ...S.card, display: "flex", justifyContent: "space-between", alignItems: "center", border: inCart ? `1px solid ${C.primary}` : `1px solid ${C.border}` }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    {item.image_url
                      ? <img src={item.image_url} alt={item.name} style={{ width: 56, height: 56, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
                      : <div style={{ fontSize: 36, width: 56, textAlign: "center", flexShrink: 0 }}>{item.image}</div>
                    }
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{item.name}</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>{item.description}</div>
                      <div style={{ color: C.primary, fontWeight: 800, marginTop: 4 }}>{fp(item.price)}</div>
                    </div>
                  </div>
                  <div>
                    {inCart ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <button onClick={() => removeFromCart(item.id)} style={S.btnSmall(C.border)}>−</button>
                        <span style={{ fontWeight: 800, minWidth: 20, textAlign: "center" }}>{inCart.qty}</span>
                        <button onClick={() => addToCart(item)} style={S.btnSmall(C.primary)}>+</button>
                      </div>
                    ) : (
                      <button onClick={() => addToCart(item)} style={{ background: C.primary, border: "none", borderRadius: 10, padding: "8px 16px", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 13, fontFamily: "'Nunito', sans-serif" }}>Agregar</button>
                    )}
                  </div>
                </div>
              );
            })}
            {cart.length > 0 && (
              <div style={{ position: "sticky", bottom: 16, marginTop: 16 }}>
                <button onClick={() => setScreen("cart")} style={{ width: "100%", background: `linear-gradient(135deg,${C.primary},${C.primaryDark})`, border: "none", borderRadius: 16, padding: 16, color: "#fff", fontWeight: 900, fontSize: 17, cursor: "pointer", fontFamily: "'Nunito', sans-serif", boxShadow: `0 4px 20px ${C.primary}80` }}>
                  Ver carrito ({cart.reduce((s, c) => s + c.qty, 0)}) → {fp(cartTotal)}
                </button>
              </div>
            )}
          </>
        )}

        {/* CARRITO */}
        {screen === "cart" && (
          <>
            <div style={{ fontWeight: 900, fontSize: 22, marginBottom: 16, marginTop: 4 }}>Tu pedido 🛒</div>
            {cart.map(item => (
              <div key={item.id} style={{ ...S.card, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div><div style={{ fontWeight: 700 }}>{item.name}</div><div style={{ fontSize: 12, color: "#64748b" }}>x{item.qty}</div></div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ color: C.primary, fontWeight: 700 }}>{fp(item.price * item.qty)}</span>
                  <button onClick={() => removeFromCart(item.id)} style={S.btnSmall("#ef4444")}>−</button>
                  <button onClick={() => addToCart(item)} style={S.btnSmall(C.primary)}>+</button>
                </div>
              </div>
            ))}
            <div style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ color: "#94a3b8" }}>Subtotal</span><span>{fp(cartTotal)}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ color: "#94a3b8" }}>Cargo por servicio</span><span>{fp(SERVICE_FEE)}</span>
              </div>
              <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 12, display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 800, fontSize: 18 }}>Total</span>
                <span style={{ fontWeight: 900, fontSize: 18, color: C.primary }}>{fp(cartTotal + SERVICE_FEE)}</span>
              </div>
            </div>
            <label style={S.label}>📍 Dirección de entrega</label>
            <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Ej: San Martín 456" style={{ ...S.input, marginBottom: 16 }} />
            <label style={{ ...S.label, marginTop: 4 }}>💳 Método de pago</label>
            <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
              {["Efectivo","Débito"].map(m => (
                <button key={m} onClick={() => setPayMethod(m)} style={{ flex: 1, padding: 12, borderRadius: 12, border: payMethod === m ? `2px solid ${C.primary}` : `1px solid ${C.border}`, background: payMethod === m ? C.primary + "22" : C.card, color: payMethod === m ? C.primary : "#94a3b8", cursor: "pointer", fontWeight: 700, fontFamily: "'Nunito', sans-serif", fontSize: 14 }}>
                  {m === "Efectivo" ? "💵" : "💳"} {m}
                </button>
              ))}
            </div>
            <button onClick={() => { if (!address.trim()) { alert("Ingresá tu dirección"); return; } setShowConfirmOrder(true); }}
              style={{ width: "100%", background: `linear-gradient(135deg,${C.primary},${C.primaryDark})`, border: "none", borderRadius: 16, padding: 18, color: "#fff", fontWeight: 900, fontSize: 17, cursor: "pointer", fontFamily: "'Nunito', sans-serif", boxShadow: `0 4px 20px ${C.primary}80` }}>
              🚀 Confirmar pedido — {fp(cartTotal + SERVICE_FEE)}
            </button>
          </>
        )}

        {/* TRACKING */}
        {screen === "tracking" && trackOrder && (
          <>
            <div style={{ fontWeight: 900, fontSize: 20, marginBottom: 16, marginTop: 4 }}>📍 Seguimiento en vivo</div>
            <div style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div><div style={{ fontWeight: 800, fontSize: 17 }}>{trackOrder.id}</div><div style={{ fontSize: 12, color: "#64748b" }}>📍 {trackOrder.address}</div></div>
                <Badge status={trackOrder.status} />
              </div>
              {["picked","delivering"].includes(trackOrder.status) && (
                <div style={{ marginBottom: 12 }}>
                  <WaButton phone={trackOrder.delivery_phone} msg={`Hola! Soy el cliente del pedido ${trackOrder.id}. `} label="💬 Contactar repartidor" />
                </div>
              )}
              <ProgressBar status={trackOrder.status} />
              {!["delivered","rejected","cancelled"].includes(trackOrder.status) && (
                <div style={{ background: "#1a0505", borderRadius: 12, padding: 14, textAlign: "center", marginTop: 8 }}>
                  <div style={{ fontSize: 13, color: "#64748b" }}>Tiempo estimado</div>
                  <div style={{ fontSize: 32, fontWeight: 900, color: C.primary }}>{trackOrder.prep_time} min</div>
                </div>
              )}
              {trackOrder.status === "pending" && (
                <button onClick={() => setShowCancelConfirm(true)} style={{ ...S.btn("#ef4444"), width: "100%", marginTop: 14, padding: 12, fontSize: 14 }}>
                  🚫 Cancelar pedido
                </button>
              )}
            </div>
            <div style={S.card}>
              {trackOrder.items?.map((item, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ color: "#94a3b8" }}>x{item.qty} {item.name}</span><span>{fp(item.price * item.qty)}</span>
                </div>
              ))}
              <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 10, paddingTop: 10, display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#94a3b8" }}>Cargo por servicio</span><span>{fp(trackOrder.delivery_fee)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                <span style={{ fontWeight: 800 }}>Total</span><span style={{ fontWeight: 900, color: C.primary }}>{fp(trackOrder.total + trackOrder.delivery_fee)}</span>
              </div>
              <div style={{ marginTop: 8, padding: "8px 12px", background: "#1a0505", borderRadius: 10, fontSize: 13, color: "#64748b" }}>💳 Pago: {trackOrder.pay_method}</div>
            </div>
            <button onClick={() => setScreen("home")} style={{ ...S.btn(C.border), width: "100%", padding: 14, fontSize: 15 }}>← Volver al inicio</button>
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// RESTAURANT
// ─────────────────────────────────────────────
function RestaurantView({ user, profile, onLogout }) {
  const [tab, setTab] = useState("orders");
  const [restaurant, setRestaurant] = useState(null);
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [newItem, setNewItem] = useState({ name: "", description: "", price: "", image: "🍽️" });
  const [restForm, setRestForm] = useState({ name: "", category: "General", image: "🍽️", delivery_time: "25-35 min" });
  const [loading, setLoading] = useState(true);
  const [editingPrepTime, setEditingPrepTime] = useState(null);
  const [newPrepTime, setNewPrepTime] = useState("");
  const [uploadingImage, setUploadingImage] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [restProfileForm, setRestProfileForm] = useState({ name: "", category: "", delivery_time: "" });
  const [savingRestProfile, setSavingRestProfile] = useState(false);
  const [restProfileMsg, setRestProfileMsg] = useState("");
  const [commissionRate, setCommissionRate] = useState(10);

  useEffect(() => {
    const load = async () => {
      const { data: rest } = await supabase.from("restaurants").select("*").eq("owner_id", user.id).single();
      if (rest) {
        setRestaurant(rest);
        setRestProfileForm({ name: rest.name, category: rest.category, delivery_time: rest.delivery_time });
        const { data: items } = await supabase.from("menu_items").select("*").eq("restaurant_id", rest.id);
        setMenuItems(items || []);
        const { data: ords } = await supabase.from("orders").select("*").eq("restaurant_id", rest.id).order("created_at", { ascending: false });
        setOrders(ords || []);
        const channel = supabase.channel("restaurant-orders")
          .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `restaurant_id=eq.${rest.id}` },
            (payload) => setOrders(prev => {
              const exists = prev.find(o => o.id === payload.new.id);
              if (exists) return prev.map(o => o.id === payload.new.id ? payload.new : o);
              return [payload.new, ...prev];
            })
          ).subscribe();
        setLoading(false);
        return () => supabase.removeChannel(channel);
      }
      setLoading(false);
    };
    load();
    // Cargar comisión actual
    supabase.from("app_config").select("value").eq("key", "commission_rate").single()
      .then(({ data }) => { if (data) setCommissionRate(parseFloat(data.value)); });
  }, [user.id]);

  const netAmount = (total) => {
    const commission = Math.round(total * commissionRate / 100);
    return { net: total - commission, commission };
  };

  const createRestaurant = async () => {
    if (!restForm.name) return;
    const { data } = await supabase.from("restaurants").insert({ ...restForm, owner_id: user.id, approved: false }).select().single();
    if (data) setRestaurant(data);
  };

  const saveRestProfile = async () => {
    setSavingRestProfile(true);
    const { error } = await supabase.from("restaurants").update(restProfileForm).eq("id", restaurant.id);
    if (error) setRestProfileMsg("❌ Error: " + error.message);
    else { setRestaurant(p => ({ ...p, ...restProfileForm })); setRestProfileMsg("✅ Datos actualizados"); }
    setSavingRestProfile(false);
    setTimeout(() => setRestProfileMsg(""), 3000);
  };

  const handleRestPhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingPhoto(true);
    const ext = file.name.split(".").pop();
    const path = `restaurant-photos/${restaurant.id}.${ext}`;
    const { error } = await supabase.storage.from("menu-images").upload(path, file, { upsert: true });
    if (!error) {
      const { data: urlData } = supabase.storage.from("menu-images").getPublicUrl(path);
      await supabase.from("restaurants").update({ photo_url: urlData.publicUrl }).eq("id", restaurant.id);
      setRestaurant(p => ({ ...p, photo_url: urlData.publicUrl }));
      setRestProfileMsg("✅ Foto actualizada");
    } else { setRestProfileMsg("❌ Error al subir foto: " + error.message); }
    setUploadingPhoto(false);
    setTimeout(() => setRestProfileMsg(""), 3000);
  };

  const updateStatus = async (id, status) => { await supabase.from("orders").update({ status }).eq("id", id); };

  const updatePrepTime = async (id) => {
    const val = parseInt(newPrepTime);
    if (!isNaN(val) && val > 0) await supabase.from("orders").update({ prep_time: val }).eq("id", id);
    setEditingPrepTime(null);
  };

  const handleImageUpload = async (e, itemId) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingImage(itemId);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${itemId}.${ext}`;
    const { error } = await supabase.storage.from("menu-images").upload(path, file, { upsert: true });
    if (!error) {
      const { data: urlData } = supabase.storage.from("menu-images").getPublicUrl(path);
      await supabase.from("menu_items").update({ image_url: urlData.publicUrl }).eq("id", itemId);
      setMenuItems(prev => prev.map(i => i.id === itemId ? { ...i, image_url: urlData.publicUrl } : i));
    } else { alert("Error al subir imagen: " + error.message); }
    setUploadingImage(null);
  };

  const addMenuItem = async () => {
    if (!newItem.name || !newItem.price) return;
    const { data } = await supabase.from("menu_items").insert({ ...newItem, price: parseFloat(newItem.price), restaurant_id: restaurant.id }).select().single();
    if (data) setMenuItems(prev => [...prev, data]);
    setNewItem({ name: "", description: "", price: "", image: "🍽️" });
  };

  const deleteMenuItem = async (id) => {
    await supabase.from("menu_items").delete().eq("id", id);
    setMenuItems(prev => prev.filter(i => i.id !== id));
  };

  if (loading) return <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><Spinner /></div>;

  if (!restaurant) return (
    <div style={{ fontFamily: "'Nunito', sans-serif", color: "#f1f5f9", minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <Logo size={64} />
          <div style={{ fontWeight: 900, fontSize: 24, marginTop: 8 }}>Configurá tu restaurante</div>
          <div style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>Será revisado antes de aparecer en {APP_NAME}</div>
        </div>
        <div style={{ background: C.card, borderRadius: 20, padding: 24 }}>
          <input value={restForm.name} onChange={e => setRestForm(p => ({ ...p, name: e.target.value }))} placeholder="Nombre del restaurante" style={{ ...S.input, marginBottom: 12 }} />
          <input value={restForm.category} onChange={e => setRestForm(p => ({ ...p, category: e.target.value }))} placeholder="Categoría (Pizzas, Parrilla...)" style={{ ...S.input, marginBottom: 12 }} />
          <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
            <input value={restForm.image} onChange={e => setRestForm(p => ({ ...p, image: e.target.value }))} placeholder="🍽️" style={{ ...S.input, width: 80, textAlign: "center", fontSize: 24 }} />
            <input value={restForm.delivery_time} onChange={e => setRestForm(p => ({ ...p, delivery_time: e.target.value }))} placeholder="Tiempo estimado" style={{ ...S.input, flex: 1 }} />
          </div>
          <button onClick={createRestaurant} style={{ width: "100%", background: `linear-gradient(135deg,${C.primary},${C.primaryDark})`, border: "none", borderRadius: 14, padding: 16, color: "#fff", fontWeight: 900, fontSize: 16, cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>
            Enviar para aprobación
          </button>
        </div>
      </div>
    </div>
  );

  if (!restaurant.approved) return (
    <div style={{ fontFamily: "'Nunito', sans-serif", color: "#f1f5f9", minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ textAlign: "center", maxWidth: 380 }}>
        <div style={{ fontSize: 64 }}>⏳</div>
        <div style={{ fontWeight: 900, fontSize: 22, marginTop: 16, color: C.accent }}>Pendiente de aprobación</div>
        <div style={{ color: "#64748b", fontSize: 15, marginTop: 12, lineHeight: 1.6 }}>
          Tu restaurante <strong style={{ color: "#f1f5f9" }}>{restaurant.name}</strong> fue registrado y está siendo revisado por {APP_NAME}.
        </div>
        <button onClick={onLogout} style={{ ...S.btn(C.border), marginTop: 24, padding: "12px 24px", fontSize: 15 }}>Cerrar sesión</button>
      </div>
    </div>
  );

  const activeOrders = orders.filter(o => !["delivered","rejected","cancelled"].includes(o.status));
  const totalCommissionHoy = orders
    .filter(o => o.status === "delivered" && new Date(o.created_at).toDateString() === new Date().toDateString())
    .reduce((s, o) => s + Math.round(o.total * commissionRate / 100), 0);

  return (
    <div style={{ fontFamily: "'Nunito', sans-serif", color: "#f1f5f9", minHeight: "100%", background: C.bg }}>
      <div style={{ background: `linear-gradient(135deg,${C.primary},${C.primaryDark})`, padding: "16px 20px", position: "sticky", top: 0, zIndex: 50, boxShadow: `0 4px 20px ${C.primary}66` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Logo size={30} />
            <div>
              <div style={{ fontWeight: 900, fontSize: 18 }}>{restaurant.name}</div>
              <div style={{ fontSize: 13, opacity: 0.8 }}>Panel · {APP_NAME} · {profile?.name}</div>
            </div>
          </div>
          <button onClick={onLogout} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", borderRadius: 20, padding: "6px 12px", cursor: "pointer", fontSize: 13, fontFamily: "'Nunito', sans-serif" }}>Salir</button>
        </div>
      </div>

      <div style={{ maxWidth: 700, margin: "0 auto", padding: 16, paddingBottom: 90 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {[["orders","📋 Pedidos"],["menu","📝 Menú"],["profile","⚙️ Perfil"]].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{ flex: 1, padding: 12, borderRadius: 12, border: "none", background: tab === key ? `linear-gradient(135deg,${C.primary},${C.primaryDark})` : C.card, color: "#fff", fontWeight: 800, cursor: "pointer", fontSize: 13, fontFamily: "'Nunito', sans-serif" }}>{label}</button>
          ))}
        </div>

        {/* PERFIL RESTAURANTE */}
        {tab === "profile" && (
          <>
            <div style={{ ...S.card, textAlign: "center" }}>
              <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 14 }}>📸 Foto del local</div>
              <div style={{ width: "100%", height: 160, borderRadius: 12, overflow: "hidden", background: "#1a0505", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                {restaurant.photo_url
                  ? <img src={restaurant.photo_url} alt="Local" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <div style={{ fontSize: 60 }}>{restaurant.image || "🍽️"}</div>
                }
              </div>
              <label style={{ display: "inline-block", background: `linear-gradient(135deg,${C.primary},${C.primaryDark})`, borderRadius: 10, padding: "10px 20px", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 14, fontFamily: "'Nunito', sans-serif" }}>
                {uploadingPhoto ? "⏳ Subiendo..." : "📷 Cambiar foto del local"}
                <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleRestPhotoUpload} disabled={uploadingPhoto} />
              </label>
            </div>
            {/* AVISO COMISIÓN */}
            <div style={{ ...S.card, border: `1px solid ${C.accent}55`, background: C.accent + "11" }}>
              <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 8, color: C.accent }}>💰 Comisión de la plataforma</div>
              <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.7 }}>
                {APP_NAME} cobra una comisión del <strong style={{ color: C.accent }}>{commissionRate}%</strong> sobre el subtotal de cada pedido.
                Este porcentaje es configurado por la administración y puede variar.
              </div>
              <div style={{ marginTop: 12, padding: "10px 14px", background: "#1a0505", borderRadius: 10, fontSize: 13 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ color: "#64748b" }}>Ejemplo — pedido de $5.000</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#94a3b8" }}>Comisión ({commissionRate}%)</span>
                  <span style={{ color: "#ef4444" }}>-{fp(5000 * commissionRate / 100)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, marginTop: 4 }}>
                  <span>Recibís</span>
                  <span style={{ color: "#10b981" }}>{fp(5000 - 5000 * commissionRate / 100)}</span>
                </div>
              </div>
            </div>
            <div style={S.card}>
              <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 14 }}>🍽️ Datos del restaurante</div>
              <label style={S.label}>Nombre</label>
              <input value={restProfileForm.name} onChange={e => setRestProfileForm(p => ({ ...p, name: e.target.value }))} style={{ ...S.input, marginBottom: 14 }} />
              <label style={S.label}>Categoría</label>
              <input value={restProfileForm.category} onChange={e => setRestProfileForm(p => ({ ...p, category: e.target.value }))} placeholder="Pizzas, Parrilla..." style={{ ...S.input, marginBottom: 14 }} />
              <label style={S.label}>Tiempo estimado de entrega</label>
              <input value={restProfileForm.delivery_time} onChange={e => setRestProfileForm(p => ({ ...p, delivery_time: e.target.value }))} placeholder="25-35 min" style={{ ...S.input, marginBottom: 20 }} />
              <SaveMsg msg={restProfileMsg} />
              <button onClick={saveRestProfile} disabled={savingRestProfile} style={{ width: "100%", background: savingRestProfile ? C.border : `linear-gradient(135deg,${C.primary},${C.primaryDark})`, border: "none", borderRadius: 12, padding: 14, color: "#fff", fontWeight: 900, fontSize: 15, cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>
                {savingRestProfile ? "Guardando..." : "💾 Guardar cambios"}
              </button>
            </div>
          </>
        )}

        {/* PEDIDOS */}
        {tab === "orders" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
              {[
                { label: "Pendientes", count: orders.filter(o => o.status === "pending").length, color: C.accent },
                { label: "En cocina", count: orders.filter(o => ["accepted","preparing"].includes(o.status)).length, color: C.primary },
                { label: "Listos", count: orders.filter(o => o.status === "ready").length, color: "#10b981" },
              ].map(s => (
                <div key={s.label} style={{ background: C.card, borderRadius: 14, padding: 14, textAlign: "center", border: `1px solid ${s.color}33` }}>
                  <div style={{ fontSize: 28, fontWeight: 900, color: s.color }}>{s.count}</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
            {/* RESUMEN COMISIÓN HOY */}
            {totalCommissionHoy > 0 && (
              <div style={{ background: C.accent + "11", border: `1px solid ${C.accent}44`, borderRadius: 12, padding: "10px 14px", marginBottom: 14, fontSize: 13, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "#94a3b8" }}>💰 Comisión {APP_NAME} hoy ({commissionRate}%)</span>
                <span style={{ color: C.accent, fontWeight: 800 }}>{fp(totalCommissionHoy)}</span>
              </div>
            )}
            {activeOrders.length === 0 && (
              <div style={{ textAlign: "center", padding: 40, color: "#475569" }}><Logo size={52} /><div style={{ marginTop: 12 }}>No hay pedidos activos</div></div>
            )}
            {activeOrders.map(order => {
              const { net, commission } = netAmount(order.total);
              return (
                <div key={order.id} style={{ ...S.card, border: `1px solid ${(STATUS_CONFIG[order.status] || STATUS_CONFIG.pending).color}44` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 17 }}>{order.id}</div>
                      <div style={{ fontSize: 13, color: "#64748b" }}>📍 {order.address}</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>💳 {order.pay_method}</div>
                    </div>
                    <Badge status={order.status} />
                  </div>
                  <div style={{ background: "#1a0505", borderRadius: 10, padding: 12, marginBottom: 12 }}>
                    {order.items?.map((item, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 4 }}>
                        <span>x{item.qty} {item.name}</span>
                        <span style={{ color: C.primary, fontWeight: 700 }}>{fp(item.price * item.qty)}</span>
                      </div>
                    ))}
                    <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 8, paddingTop: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                        <span style={{ color: "#64748b" }}>Total pedido</span><span>{fp(order.total)}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                        <span style={{ color: "#ef4444" }}>Comisión {APP_NAME} ({commissionRate}%)</span>
                        <span style={{ color: "#ef4444" }}>-{fp(commission)}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, marginTop: 4 }}>
                        <span>Recibís</span><span style={{ color: "#10b981" }}>{fp(net)}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <span style={{ fontSize: 13, color: "#64748b" }}>⏱</span>
                    {editingPrepTime === order.id ? (
                      <>
                        <input value={newPrepTime} onChange={e => setNewPrepTime(e.target.value)} type="number" style={{ width: 60, padding: "4px 8px", background: "#1a0505", border: `1px solid ${C.primary}`, borderRadius: 8, color: "#f1f5f9", fontFamily: "'Nunito', sans-serif", fontSize: 14 }} />
                        <span style={{ fontSize: 13, color: "#64748b" }}>min</span>
                        <button onClick={() => updatePrepTime(order.id)} style={S.btn("#10b981")}>✓</button>
                        <button onClick={() => setEditingPrepTime(null)} style={S.btn("#ef4444")}>✕</button>
                      </>
                    ) : (
                      <>
                        <span style={{ color: C.primary, fontWeight: 800 }}>{order.prep_time} min</span>
                        <button onClick={() => { setEditingPrepTime(order.id); setNewPrepTime(order.prep_time); }} style={S.btn(C.border)}>Ajustar</button>
                      </>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {order.status === "pending" && (<><button onClick={() => updateStatus(order.id, "accepted")} style={S.btn(C.primary)}>✅ Aceptar</button><button onClick={() => updateStatus(order.id, "rejected")} style={S.btn("#ef4444")}>✕ Rechazar</button></>)}
                    {order.status === "accepted" && <button onClick={() => updateStatus(order.id, "preparing")} style={S.btn(C.primary)}>👨‍🍳 Iniciar preparación</button>}
                    {order.status === "preparing" && <button onClick={() => updateStatus(order.id, "ready")} style={S.btn("#10b981")}>📦 Marcar listo</button>}
                    {order.status === "ready" && <div style={{ fontSize: 13, color: "#10b981", padding: "8px 0" }}>✅ Esperando repartidor...</div>}
                    {["accepted","preparing","ready"].includes(order.status) && (
                      <WaButton phone={order.client_phone} msg={`Hola! Te escribimos desde ${restaurant.name} sobre tu pedido ${order.id}. `} label="💬 Contactar cliente" />
                    )}
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* MENU */}
        {tab === "menu" && (
          <>
            <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 14 }}>Menú de {restaurant.name}</div>
            {menuItems.map(item => (
              <div key={item.id} style={{ ...S.card, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center", flex: 1 }}>
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    {item.image_url
                      ? <img src={item.image_url} alt={item.name} style={{ width: 60, height: 60, borderRadius: 10, objectFit: "cover" }} />
                      : <div style={{ width: 60, height: 60, borderRadius: 10, background: "#1a0505", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>{item.image}</div>
                    }
                    <label style={{ position: "absolute", bottom: -4, right: -4, background: uploadingImage === item.id ? C.border : C.primary, borderRadius: "50%", width: 24, height: 24, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>
                      {uploadingImage === item.id ? "⏳" : "📷"}
                      <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handleImageUpload(e, item.id)} />
                    </label>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700 }}>{item.name}</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>{item.description}</div>
                    <div style={{ color: C.primary, fontWeight: 700, marginTop: 2 }}>{fp(item.price)}</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>Recibís: {fp(item.price - item.price * commissionRate / 100)}</div>
                  </div>
                </div>
                <button onClick={() => deleteMenuItem(item.id)} style={S.btn("#ef4444")}>Eliminar</button>
              </div>
            ))}
            <div style={{ ...S.card, border: `1px dashed ${C.border}`, marginTop: 8 }}>
              <div style={{ fontWeight: 700, marginBottom: 12, color: "#94a3b8" }}>+ Agregar nuevo plato</div>
              <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                <input value={newItem.image} onChange={e => setNewItem(p => ({ ...p, image: e.target.value }))} placeholder="🍽️" style={{ ...S.input, width: 70, textAlign: "center", fontSize: 22 }} />
                <input value={newItem.name} onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))} placeholder="Nombre del plato" style={{ ...S.input, flex: 1 }} />
              </div>
              <input value={newItem.description} onChange={e => setNewItem(p => ({ ...p, description: e.target.value }))} placeholder="Descripción" style={{ ...S.input, marginBottom: 10 }} />
              <div style={{ display: "flex", gap: 10 }}>
                <input value={newItem.price} onChange={e => setNewItem(p => ({ ...p, price: e.target.value }))} type="number" placeholder="Precio $" style={{ ...S.input, flex: 1 }} />
                <button onClick={addMenuItem} style={{ background: `linear-gradient(135deg,${C.primary},${C.primaryDark})`, border: "none", borderRadius: 10, padding: "10px 20px", color: "#fff", fontWeight: 800, cursor: "pointer", fontSize: 14, fontFamily: "'Nunito', sans-serif" }}>Agregar</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// DELIVERY
// ─────────────────────────────────────────────
function DeliveryView({ user, profile: initialProfile, onLogout }) {
  const [profile, setProfile] = useState(initialProfile);
  const [tab, setTab] = useState("orders");
  const [orders, setOrders] = useState([]);
  const [myDeliveries, setMyDeliveries] = useState([]);
  const [feeInput, setFeeInput] = useState({});
  const [loading, setLoading] = useState(true);
  const [profileForm, setProfileForm] = useState({ name: initialProfile?.name || "", phone: initialProfile?.phone || "", mp_link: initialProfile?.mp_link || "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");

  const saveProfile = async () => {
    setSavingProfile(true);
    const updates = { name: profileForm.name, phone: profileForm.phone, mp_link: profileForm.mp_link };
    const { error } = await supabase.from("profiles").update(updates).eq("id", user.id);
    if (error) setProfileMsg("❌ Error: " + error.message);
    else { setProfile(p => ({ ...p, ...updates })); setProfileMsg("✅ Perfil actualizado"); }
    setSavingProfile(false);
    setTimeout(() => setProfileMsg(""), 3000);
  };

  useEffect(() => {
    const load = async () => {
      const { data: ready } = await supabase.from("orders").select("*").eq("status", "ready").is("delivery_id", null);
      const { data: mine } = await supabase.from("orders").select("*").eq("delivery_id", user.id).order("created_at", { ascending: false });
      setOrders(ready || []); setMyDeliveries(mine || []); setLoading(false);
    };
    load();
    const channel = supabase.channel("delivery-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, (payload) => {
        const o = payload.new;
        if (o.status === "ready" && !o.delivery_id) {
          setOrders(prev => prev.find(x => x.id === o.id) ? prev.map(x => x.id === o.id ? o : x) : [o, ...prev]);
        } else {
          setOrders(prev => prev.filter(x => x.id !== o.id));
        }
        if (o.delivery_id === user.id) {
          setMyDeliveries(prev => prev.find(x => x.id === o.id) ? prev.map(x => x.id === o.id ? o : x) : [o, ...prev]);
        }
      }).subscribe();
    return () => supabase.removeChannel(channel);
  }, [user.id]);

  const acceptDelivery = async (order) => {
    const fee = parseInt(feeInput[order.id]) || 500;
    await supabase.from("orders").update({
      status: "picked", delivery_id: user.id, delivery_fee: fee, delivery_phone: profile?.phone,
    }).eq("id", order.id);
  };

  const updateStatus = async (id, status) => { await supabase.from("orders").update({ status }).eq("id", id); };

  if (loading) return <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><Spinner /></div>;

  const active = myDeliveries.filter(o => !["delivered","rejected","cancelled"].includes(o.status));
  const delivered = myDeliveries.filter(o => o.status === "delivered");

  return (
    <div style={{ fontFamily: "'Nunito', sans-serif", color: "#f1f5f9", minHeight: "100%", background: C.bg }}>
      <div style={{ background: `linear-gradient(135deg,${C.primary},${C.primaryDark})`, padding: "16px 20px", position: "sticky", top: 0, zIndex: 50, boxShadow: `0 4px 20px ${C.primary}66` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Logo size={30} />
            <div>
              <div style={{ fontWeight: 900, fontSize: 18 }}>🛵 {APP_NAME} Repartidor</div>
              <div style={{ fontSize: 13, opacity: 0.8 }}>{profile?.name} · En línea</div>
            </div>
          </div>
          <button onClick={onLogout} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", borderRadius: 20, padding: "6px 12px", cursor: "pointer", fontSize: 13, fontFamily: "'Nunito', sans-serif" }}>Salir</button>
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: "0 auto", padding: 16, paddingBottom: 90 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {[["orders","📦 Pedidos"],["profile","⚙️ Mi perfil"]].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{ flex: 1, padding: 12, borderRadius: 12, border: "none", background: tab === key ? `linear-gradient(135deg,${C.primary},${C.primaryDark})` : C.card, color: "#fff", fontWeight: 800, cursor: "pointer", fontSize: 14, fontFamily: "'Nunito', sans-serif" }}>{label}</button>
          ))}
        </div>

        {tab === "profile" && (
          <div style={S.card}>
            <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 16 }}>⚙️ Mi perfil</div>
            <label style={S.label}>Nombre</label>
            <input value={profileForm.name} onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))} style={{ ...S.input, marginBottom: 14 }} />
            <label style={S.label}>Teléfono</label>
            <input value={profileForm.phone} onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))} placeholder="+54 11 1234-5678" style={{ ...S.input, marginBottom: 14 }} />
            <label style={S.label}>Link de MercadoPago</label>
            <input value={profileForm.mp_link} onChange={e => setProfileForm(p => ({ ...p, mp_link: e.target.value }))} placeholder="Ej: juan.garcia.mp" style={{ ...S.input, marginBottom: 8 }} />
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 20, lineHeight: 1.6 }}>
              💡 Los clientes que paguen con débito recibirán este link para pagarte.
            </div>
            <SaveMsg msg={profileMsg} />
            <button onClick={saveProfile} disabled={savingProfile} style={{ width: "100%", background: savingProfile ? C.border : `linear-gradient(135deg,${C.primary},${C.primaryDark})`, border: "none", borderRadius: 12, padding: 14, color: "#fff", fontWeight: 900, fontSize: 15, cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>
              {savingProfile ? "Guardando..." : "💾 Guardar cambios"}
            </button>
          </div>
        )}

        {tab === "orders" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
              {[
                { label: "Disponibles", count: orders.length, color: C.primary },
                { label: "En curso", count: active.length, color: C.accent },
                { label: "Ganado hoy", count: fp(delivered.reduce((s, o) => s + (o.delivery_fee || 0), 0)), color: "#10b981" },
              ].map(s => (
                <div key={s.label} style={{ background: C.card, borderRadius: 14, padding: 14, textAlign: "center" }}>
                  <div style={{ fontSize: s.label === "Ganado hoy" ? 16 : 28, fontWeight: 900, color: s.color }}>{s.count}</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
            {!profile?.mp_link && (
              <div onClick={() => setTab("profile")} style={{ background: C.primary + "22", border: `1px solid ${C.primary}`, borderRadius: 12, padding: 14, marginBottom: 16, cursor: "pointer" }}>
                <div style={{ fontWeight: 700, color: C.primary }}>⚠️ Configurá tu link de MercadoPago</div>
                <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>Tocá acá para agregar tu link de cobro.</div>
              </div>
            )}
            {orders.length > 0 && (
              <>
                <div style={{ fontSize: 12, color: C.primary, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>📦 Listos para retirar</div>
                {orders.map(order => (
                  <div key={order.id} style={{ ...S.card, border: `1px solid ${C.primary}44` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                      <div>
                        <div style={{ fontWeight: 800 }}>{order.id}</div>
                        <div style={{ fontSize: 13, color: "#64748b" }}>📍 {order.address}</div>
                        <div style={{ fontSize: 13, color: "#64748b" }}>💳 {order.pay_method} · {fp(order.total)}</div>
                      </div>
                      <Badge status={order.status} />
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      {order.items?.map((item, i) => <div key={i} style={{ fontSize: 13, color: "#64748b" }}>x{item.qty} {item.name}</div>)}
                    </div>
                    <div style={{ background: "#1a0505", borderRadius: 10, padding: 12, marginBottom: 12 }}>
                      <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 8 }}>💰 Tu cargo de envío:</div>
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <input type="number" value={feeInput[order.id] || ""} onChange={e => setFeeInput(p => ({ ...p, [order.id]: e.target.value }))} placeholder="500" style={{ ...S.input, width: 100, textAlign: "center" }} />
                        <span style={{ fontSize: 13, color: "#64748b" }}>→ Total: {fp(order.total + (parseInt(feeInput[order.id]) || 500))}</span>
                      </div>
                    </div>
                    <button onClick={() => acceptDelivery(order)} style={{ width: "100%", background: `linear-gradient(135deg,${C.primary},${C.primaryDark})`, border: "none", borderRadius: 12, padding: 14, color: "#fff", fontWeight: 900, fontSize: 15, cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>
                      🛵 Aceptar y retirar
                    </button>
                  </div>
                ))}
              </>
            )}
            {active.length > 0 && (
              <>
                <div style={{ fontSize: 12, color: C.accent, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10, marginTop: 8 }}>🛵 En curso</div>
                {active.map(order => (
                  <div key={order.id} style={{ ...S.card, border: `1px solid ${C.accent}44` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                      <div>
                        <div style={{ fontWeight: 800 }}>{order.id}</div>
                        <div style={{ fontSize: 14, color: C.accent, fontWeight: 700 }}>📍 {order.address}</div>
                        <div style={{ fontSize: 13, color: "#64748b" }}>💰 Cobrar: <strong style={{ color: "#f1f5f9" }}>{fp(order.total + order.delivery_fee)}</strong> ({order.pay_method})</div>
                        <div style={{ fontSize: 12, color: "#64748b" }}>Tu cargo: {fp(order.delivery_fee)}</div>
                      </div>
                      <Badge status={order.status} />
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      {order.status === "picked" && <button onClick={() => updateStatus(order.id, "delivering")} style={{ ...S.btn(C.primary), flex: 1 }}>📍 Saliendo hacia cliente</button>}
                      {order.status === "delivering" && <button onClick={() => updateStatus(order.id, "delivered")} style={{ ...S.btn("#10b981"), flex: 1 }}>✅ Confirmar entrega</button>}
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                      <WaButton phone={order.client_phone} msg={`Hola! Soy tu repartidor del pedido ${order.id}. `} label="💬 Contactar cliente" />
                      <WaButton phone={order.restaurant_phone} msg={`Hola! Soy el repartidor del pedido ${order.id}. `} label="💬 Contactar restaurante" />
                    </div>
                  </div>
                ))}
              </>
            )}
            {orders.length === 0 && active.length === 0 && (
              <div style={{ textAlign: "center", padding: 50, color: "#475569" }}>
                <div style={{ fontSize: 52 }}>🛵</div>
                <div style={{ marginTop: 12, fontSize: 16 }}>Sin pedidos disponibles</div>
                <div style={{ fontSize: 13, marginTop: 6, color: "#64748b" }}>Los pedidos aparecerán acá cuando estén listos</div>
              </div>
            )}
            {delivered.length > 0 && (
              <>
                <div style={{ fontSize: 12, color: "#10b981", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10, marginTop: 8 }}>✅ Entregas de hoy</div>
                {delivered.map(order => (
                  <div key={order.id} style={{ background: C.card, borderRadius: 12, padding: 14, marginBottom: 8, opacity: 0.7 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontWeight: 700 }}>{order.id}</span>
                      <span style={{ color: "#10b981", fontWeight: 800 }}>+{fp(order.delivery_fee)}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{order.address}</div>
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// ADMIN
// ─────────────────────────────────────────────
function AdminView({ onLogout }) {
  const [tab, setTab] = useState("restaurants");
  const [restaurants, setRestaurants] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commissionRate, setCommissionRate] = useState("10");
  const [savingCommission, setSavingCommission] = useState(false);
  const [commissionMsg, setCommissionMsg] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data: rests } = await supabase.from("restaurants").select("*, profiles(name, phone)").order("created_at", { ascending: false });
      const { data: profs } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      const { data: config } = await supabase.from("app_config").select("value").eq("key", "commission_rate").single();
      setRestaurants(rests || []); setUsers(profs || []);
      if (config) setCommissionRate(config.value);
      setLoading(false);
    };
    load();
  }, []);

  const saveCommission = async () => {
    setSavingCommission(true);
    const val = parseFloat(commissionRate);
    if (isNaN(val) || val < 0 || val > 100) { setCommissionMsg("❌ Valor inválido (0-100)"); setSavingCommission(false); return; }
    const { error } = await supabase.from("app_config").upsert({ key: "commission_rate", value: String(val), updated_at: new Date().toISOString() });
    if (error) setCommissionMsg("❌ Error: " + error.message);
    else setCommissionMsg("✅ Comisión actualizada a " + val + "%");
    setSavingCommission(false);
    setTimeout(() => setCommissionMsg(""), 3000);
  };

  const approveRestaurant = async (id, approved) => {
    if (!approved) {
      await supabase.from("restaurants").delete().eq("id", id);
      setRestaurants(prev => prev.filter(r => r.id !== id));
    } else {
      await supabase.from("restaurants").update({ approved: true, active: true }).eq("id", id);
      setRestaurants(prev => prev.map(r => r.id === id ? { ...r, approved: true, active: true } : r));
    }
  };

  const pending = restaurants.filter(r => !r.approved);
  const approved = restaurants.filter(r => r.approved);

  return (
    <div style={{ fontFamily: "'Nunito', sans-serif", color: "#f1f5f9", minHeight: "100%", background: C.bg }}>
      <div style={{ background: `linear-gradient(135deg,${C.bg},${C.card})`, borderBottom: `2px solid ${C.primary}`, padding: "16px 20px", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Logo size={34} />
            <div>
              <div style={{ fontWeight: 900, fontSize: 18, color: C.primary }}>Panel Admin · {APP_NAME}</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>Control total de la plataforma</div>
            </div>
          </div>
          <button onClick={onLogout} style={S.btn(C.border)}>Salir</button>
        </div>
      </div>
      <div style={{ maxWidth: 700, margin: "0 auto", padding: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
          {[
            { label: "Usuarios", count: users.length, color: C.primary },
            { label: "Pendientes", count: pending.length, color: C.accent },
            { label: "Aprobados", count: approved.length, color: "#10b981" },
            { label: "Repartidores", count: users.filter(u => u.role === "delivery").length, color: "#0891b2" },
          ].map(s => (
            <div key={s.label} style={{ background: C.card, borderRadius: 14, padding: 14, textAlign: "center", border: `1px solid ${s.color}33` }}>
              <div style={{ fontSize: 24, fontWeight: 900, color: s.color }}>{s.count}</div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* CONFIGURACIÓN COMISIÓN */}
        <div style={{ ...S.card, border: `1px solid ${C.accent}55`, marginBottom: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 14, color: C.accent }}>💰 Comisión de la plataforma</div>
          <div style={{ fontSize: 13, color: "#64748b", marginBottom: 14 }}>
            Este porcentaje se descuenta del total de cada pedido. Los restaurantes ven el monto neto que reciben.
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ position: "relative", flex: 1 }}>
              <input
                type="number" value={commissionRate} onChange={e => setCommissionRate(e.target.value)}
                min="0" max="100" step="0.5"
                style={{ ...S.input, paddingRight: 40 }}
              />
              <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontWeight: 700 }}>%</span>
            </div>
            <button onClick={saveCommission} disabled={savingCommission} style={{ ...S.btn(C.primary), padding: "10px 20px", fontSize: 14 }}>
              {savingCommission ? "Guardando..." : "Guardar"}
            </button>
          </div>
          {commissionMsg && <div style={{ marginTop: 10 }}><SaveMsg msg={commissionMsg} /></div>}
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {[["restaurants","🍽️ Restaurantes"],["users","👥 Usuarios"]].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{ flex: 1, padding: 12, borderRadius: 12, border: "none", background: tab === key ? `linear-gradient(135deg,${C.primary},${C.primaryDark})` : C.card, color: "#fff", fontWeight: 800, cursor: "pointer", fontSize: 14, fontFamily: "'Nunito', sans-serif" }}>{label}</button>
          ))}
        </div>

        {loading ? <Spinner /> : (
          <>
            {tab === "restaurants" && (
              <>
                {pending.length > 0 && (
                  <>
                    <div style={{ fontSize: 12, color: C.accent, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>⏳ Esperando aprobación</div>
                    {pending.map(r => (
                      <div key={r.id} style={{ ...S.card, border: `1px solid ${C.accent}55` }}>
                        <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 14 }}>
                          <div style={{ fontSize: 40 }}>{r.image}</div>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: 17 }}>{r.name}</div>
                            <div style={{ fontSize: 13, color: "#94a3b8" }}>{r.category} · {r.delivery_time}</div>
                            <div style={{ fontSize: 12, color: "#64748b" }}>Dueño: {r.profiles?.name} · {r.profiles?.phone}</div>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button onClick={() => approveRestaurant(r.id, true)} style={{ ...S.btn("#10b981"), flex: 1, padding: 12, fontSize: 14 }}>✅ Aprobar</button>
                          <button onClick={() => approveRestaurant(r.id, false)} style={{ ...S.btn("#ef4444"), padding: 12, fontSize: 14 }}>✕ Rechazar</button>
                        </div>
                      </div>
                    ))}
                  </>
                )}
                {approved.length > 0 && (
                  <>
                    <div style={{ fontSize: 12, color: "#10b981", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10, marginTop: 8 }}>✅ Aprobados</div>
                    {approved.map(r => (
                      <div key={r.id} style={{ ...S.card, opacity: 0.85 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                            {r.photo_url
                              ? <img src={r.photo_url} alt={r.name} style={{ width: 48, height: 48, borderRadius: 10, objectFit: "cover" }} />
                              : <div style={{ fontSize: 32 }}>{r.image}</div>
                            }
                            <div>
                              <div style={{ fontWeight: 700 }}>{r.name}</div>
                              <div style={{ fontSize: 12, color: "#64748b" }}>{r.category} · {r.profiles?.name}</div>
                            </div>
                          </div>
                          <button onClick={() => approveRestaurant(r.id, false)} style={S.btn("#ef4444")}>Suspender</button>
                        </div>
                      </div>
                    ))}
                  </>
                )}
                {restaurants.length === 0 && <div style={{ textAlign: "center", padding: 40, color: "#475569" }}><Logo size={52} /><div style={{ marginTop: 12 }}>No hay restaurantes aún</div></div>}
              </>
            )}
            {tab === "users" && (
              <>
                {[["client","👤 Clientes"],["restaurant","🍽️ Restaurantes"],["delivery","🛵 Repartidores"]].map(([role, label]) => {
                  const filtered = users.filter(u => u.role === role);
                  if (!filtered.length) return null;
                  return (
                    <div key={role}>
                      <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10, marginTop: 12 }}>{label} ({filtered.length})</div>
                      {filtered.map(u => (
                        <div key={u.id} style={{ background: C.card, borderRadius: 12, padding: "12px 16px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <div style={{ fontWeight: 700 }}>{u.name}</div>
                            <div style={{ fontSize: 12, color: "#64748b" }}>{u.phone || "Sin teléfono"}</div>
                            {u.mp_link && <div style={{ fontSize: 12, color: "#06b6d4", marginTop: 2 }}>💳 {u.mp_link}</div>}
                          </div>
                          <div style={{ fontSize: 11, color: "#475569" }}>{new Date(u.created_at).toLocaleDateString("es-AR")}</div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// ROOT
// ─────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (window.hideSplash) setTimeout(window.hideSplash, 500);
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadProfile(session.user.id);
      else setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) loadProfile(session.user.id);
      else { setProfile(null); setLoading(false); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId) => {
    let attempts = 0;
    while (attempts < 5) {
      const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
      if (data) { setProfile(data); setLoading(false); return; }
      await new Promise(r => setTimeout(r, 800));
      attempts++;
    }
    setLoading(false);
  };

  const handleLogout = async () => { await supabase.auth.signOut(); };
  const isAdmin = ADMIN_EMAILS.includes(session?.user?.email);

  return (
    <>
      <style>{`
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        *{box-sizing:border-box} body{margin:0;background:#1a0505}
        input::placeholder{color:#6b2020}
      `}</style>
      <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap" rel="stylesheet" />
      {loading ? (
        <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif" }}>
          <div style={{ animation: "float 1.5s ease-in-out infinite" }}><Logo size={80} /></div>
          <div style={{ color: C.primary, fontSize: 28, fontWeight: 900, marginTop: 12 }}>{APP_NAME}</div>
          <div style={{ marginTop: 20 }}><Spinner /></div>
        </div>
      ) : !session ? (
        <AuthScreen />
      ) : isAdmin ? (
        <AdminView onLogout={handleLogout} />
      ) : profile?.role === "restaurant" ? (
        <RestaurantView user={session.user} profile={profile} onLogout={handleLogout} />
      ) : profile?.role === "delivery" ? (
        <DeliveryView user={session.user} profile={profile} onLogout={handleLogout} />
      ) : (
        <ClientView user={session.user} profile={profile} onLogout={handleLogout} />
      )}
    </>
  );
}
