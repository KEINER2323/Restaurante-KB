/* -------------------------
   Interacciones y lógica
   ------------------------- */


document.addEventListener('DOMContentLoaded', () => {
  // Utils
  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));

  // YEAR
  if ($('#year')) {
  $('#year').textContent = new Date().getFullYear();
}


  /* ----------------------
     NAV TOGGLE + SMOOTH SCROLL
     ---------------------- */
  const navToggle = $('#navToggle');
  const navList = document.querySelector('.nav-list');
  navToggle && navToggle.addEventListener('click', () => {
    const shown = navList.style.display === 'flex';
    navList.style.display = shown ? '' : 'flex';
  });

  // Smooth scroll for nav links
  $$('.nav-link').forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const id = a.getAttribute('href');
      const target = document.querySelector(id);
      if (target) target.scrollIntoView({behavior:'smooth', block:'start'});
      // close mobile nav
      if (getComputedStyle(navToggle).display !== 'none') navList.style.display = '';
    });
  });

  /* ----------------------
     HERO SLIDER (auto + controls)
     ---------------------- */
  const slides = $$('.slide');
  let current = 0;
  const total = slides.length;
  const heroTitle = $('#heroTitle');
  function showSlide(idx){
    const slider = document.querySelector('.hero-slider');
    const pos = -idx * 100;
    slider.style.transform = `translateX(${pos}%)`;
    // update title from data
    const title = slides[idx].dataset.title || '';
    heroTitle.textContent = title;
    current = idx;
  }
  // controls
  $('#prevSlide').addEventListener('click', () => showSlide((current-1+total)%total));
  $('#nextSlide').addEventListener('click', () => showSlide((current+1)%total));
  // autoplay
  let heroInterval = setInterval(()=> showSlide((current+1)%total), 6000);
  // pause on hover
  document.querySelector('.hero').addEventListener('mouseenter', ()=> clearInterval(heroInterval));
  document.querySelector('.hero').addEventListener('mouseleave', ()=> heroInterval = setInterval(()=> showSlide((current+1)%total), 6000));
  showSlide(0);

  /* ----------------------
     VIEW DISH MODAL + CART (localStorage)
     ---------------------- */
  const dishModal = $('#dishModal');
  const dishContent = $('#dishContent');
  const cartModal = $('#cartModal');
  const cartContent = $('#cartContent');
  const cartCount = $('#cartCount');
  const CART_KEY = 'km_cart_v1';
  let cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');

  function updateCartUI(){
    cartCount.textContent = cart.length;
    if (cart.length === 0) cartContent.innerHTML = '<p>Tu pedido está vacío</p>';
    else {
      cartContent.innerHTML = cart.map((it, i) => `<div class="cart-row">
        <strong>${it}</strong>
        <button data-remove="${i}" class="btn small btn-ghost">Quitar</button>
      </div>`).join('');
    }
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }

  // open dish modal
  $$('.viewDishBtn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const card = btn.closest('.card');
      const dish = JSON.parse(card.dataset.dish);
      dishContent.innerHTML = `
        <h3>${dish.title}</h3>
        <p>${dish.desc}</p>
        <p><strong>Precio:</strong> ${dish.price}</p>
        <div style="margin-top:10px">
          <button class="btn" id="addDishNow">Agregar al pedido</button>
          <button class="btn btn-ghost" data-close="dishModal">Cerrar</button>
        </div>
      `;
      openModal('dishModal');
      $('#addDishNow').addEventListener('click', () => {
        cart.push(dish.title);
        updateCartUI();
        notify('Añadido al pedido');
        closeModal('dishModal');
      });
    });
  });

  // add by data-add buttons
  $$('[data-add]').forEach(b => {
    b.addEventListener('click', () => {
      cart.push(b.dataset.add);
      updateCartUI();
      notify('Añadido al pedido');
    });
  });

  // modal open/close generic
  function openModal(id){
    const m = $(`#${id}`);
    if (m) m.setAttribute('aria-hidden','false');
  }
  function closeModal(id){
    const m = $(`#${id}`);
    if (m) m.setAttribute('aria-hidden','true');
  }
  // wire close buttons
  $$('[data-close]').forEach(b => b.addEventListener('click', () => closeModal(b.dataset.close)));
  $$('.modal-close').forEach(b => b.addEventListener('click', (e) => {
    const ancestor = b.closest('.modal');
    if (ancestor) ancestor.setAttribute('aria-hidden','true');
  }));

  // open reserva btn and cart btn
  $('#openReservaBtn').addEventListener('click', () => location.href = '#reservas');
  $('#openCartBtn').addEventListener('click', () => openModal('cartModal'));
  $('#clearCartBtn').addEventListener('click', () => {
    cart = [];
    updateCartUI();
  });

  // remove from cart
  cartContent.addEventListener('click', (e) => {
    const r = e.target.closest('[data-remove]');
    if (r) {
      const idx = Number(r.dataset.remove);
      cart.splice(idx,1);
      updateCartUI();
    }
  });

  // checkout simulated
  $('#checkoutBtn').addEventListener('click', () => {
    if (cart.length === 0) return notify('Tu pedido está vacío', true);
    // Simular pago y limpiar
    notify('Pago simulado. ¡Gracias por tu compra!');
    cart = [];
    updateCartUI();
    closeModal('cartModal');
  });

  updateCartUI();

  /* ----------------------
     RESERVAS: Validaciones + localStorage
     ---------------------- */
  const RES_KEY = 'km_reservas_v1';
  let reservas = JSON.parse(localStorage.getItem(RES_KEY) || '[]');

  function renderReservas(){
    const container = $('#reservasList');
    if (!container) return;
    if (reservas.length === 0) container.innerHTML = '<p>No tienes reservas guardadas.</p>';
    else {
      container.innerHTML = reservas.slice().reverse().map((r,i) => `
        <div class="res-item">
          <strong>${r.name}</strong>
          <div>${r.date} ${r.time} · ${r.people} personas</div>
          <div style="font-size:13px;color:#ddd">${r.notes || ''} · ${r.phone}</div>
        </div>
      `).join('');
    }
  }

  $('#reservaForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#rName').value.trim();
    const phone = $('#rPhone').value.trim();
    const date = $('#rDate').value;
    const time = $('#rTime').value;
    const people = $('#rPeople').value;
    const notes = $('#rNotes').value.trim();

    // Validaciones
    if (!name || !phone || !date || !time) return notify('Por favor completa todos los campos obligatorios', true);
    const selected = new Date(`${date}T${time}`);
    if (isNaN(selected.getTime())) return notify('Fecha u hora inválida', true);
    const now = new Date();
    if (selected < now) return notify('No puedes reservar en el pasado', true);

    // Guardar
    const res = { name, phone, date, time, people, notes, id: Date.now() };
    reservas.push(res);
    localStorage.setItem(RES_KEY, JSON.stringify(reservas));
    renderReservas();
    notify('Reserva guardada localmente. Te esperamos!');
    e.target.reset();
  });

  $('#clearResBtn').addEventListener('click', () => $('#reservaForm').reset());

  // render initial
  renderReservas();

  /* ----------------------
     CONTACT FORM (simulado)
     ---------------------- */
  $('#contactForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#cName').value.trim();
    const email = $('#cEmail').value.trim();
    const msg = $('#cMessage').value.trim();
    if (!name || !email || !msg) return notify('Completa todos los campos', true);

    // Simular envío con delay visual
    notify('Enviando mensaje...');
    setTimeout(()=> {
      notify('Mensaje enviado. Gracias!');
      e.target.reset();
    }, 800);
  });

  /* ----------------------
     GALLERY LIGHTBOX
     ---------------------- */
  const lightbox = $('#lightbox');
  const lbImg = $('#lbImg');
  $$('.gallery-item').forEach(img => {
    img.addEventListener('click', () => {
      lbImg.src = img.src;
      lightbox.setAttribute('aria-hidden','false');
    });
  });
  $('#lbClose').addEventListener('click', () => lightbox.setAttribute('aria-hidden','true'));
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) lightbox.setAttribute('aria-hidden','true');
  });

  /* ----------------------
     Notifications (tiny toast)
     ---------------------- */
  function notify(msg, isError = false){
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    t.style.position = 'fixed';
    t.style.bottom = '24px';
    t.style.left = '50%';
    t.style.transform = 'translateX(-50%)';
    t.style.background = isError ? 'rgba(200,60,60,0.95)' : 'rgba(50,60,50,0.95)';
    t.style.padding = '10px 14px';
    t.style.borderRadius = '8px';
    t.style.zIndex = 9999;
    document.body.appendChild(t);
    setTimeout(()=> t.style.opacity = '0.0', 2000);
    setTimeout(()=> t.remove(), 2700);
  }

  /* ----------------------
     Small UX: keyboard close modals with ESC
     ---------------------- */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      $$('.modal').forEach(m => m.setAttribute('aria-hidden','true'));
      lightbox.setAttribute('aria-hidden','true');
    }
  });

  /* ----------------------
     Small accessibility: trap focus not implemented (simple)
     ---------------------- */
});

// ==== FILTRO DE CATEGORÍAS EN EL MENÚ ====
document.addEventListener("DOMContentLoaded", () => {
    const botones = document.querySelectorAll(".filtro-btn");
    const platos = document.querySelectorAll(".plato-card");

    botones.forEach(btn => {
        btn.addEventListener("click", () => {
            // quitar clase activa a todos los botones
            botones.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            const categoria = btn.dataset.categoria;
            platos.forEach(plato => {
                if (categoria === "todos" || plato.dataset.categoria === categoria) {
                    plato.style.display = "block";
                } else {
                    plato.style.display = "none";
                }
            });
        });
    });
});

// ==== FORMULARIO DE RESERVACIÓN ====
  document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formReservacion");


  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const nombre = document.getElementById("nombre").value.trim();
      const email = document.getElementById("email").value.trim();
      const telefono = document.getElementById("telefono").value.trim();
      const fecha = document.getElementById("fecha").value;
      const hora = document.getElementById("hora").value;
      const personas = document.getElementById("personas").value;

      if (!nombre || !email || !telefono || !fecha || !hora || !personas) {
        alert("Por favor, completa todos los campos obligatorios.");
        return;
      }

      // Mensaje de éxito
      const mensajeExito = document.getElementById("mensajeExito");
      mensajeExito.textContent = "✅ ¡Tu reservación ha sido registrada exitosamente!";
      mensajeExito.style.display = "block";

      // Limpiar formulario
      form.reset();

      // Ocultar mensaje después de unos segundos
      setTimeout(() => {
        mensajeExito.style.display = "none";
      }, 4000);
  });
}

// ==== GALERÍA CON LIGHTBOX ====
document.addEventListener("DOMContentLoaded", () => {
  const galeriaItems = document.querySelectorAll(".galeria-item");
  const lightbox = document.getElementById("lightbox");
  const imagenLightbox = document.getElementById("imagenLightbox");
  const cerrarLightbox = document.getElementById("cerrarLightbox");

  if (galeriaItems.length) {
    galeriaItems.forEach(item => {
      item.addEventListener("click", () => {
        imagenLightbox.src = item.src;
        lightbox.style.display = "flex";
      });
    });

    cerrarLightbox.addEventListener("click", () => {
      lightbox.style.display = "none";
    });

    // Cerrar con clic fuera de la imagen
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) {
        lightbox.style.display = "none";
      }
    });
  }
});

// ==== FORMULARIO DE CONTACTO ====
document.addEventListener("DOMContentLoaded", () => {
  const formContacto = document.getElementById("formContacto");
  const mensajeConfirmacion = document.getElementById("mensajeConfirmacion");

  if (formContacto) {
    formContacto.addEventListener("submit", (e) => {
      e.preventDefault();

      const nombre = document.getElementById("nombreContacto").value.trim();
      const email = document.getElementById("emailContacto").value.trim();
      const mensaje = document.getElementById("mensajeContacto").value.trim();

      if (!nombre || !email || !mensaje) {
        mensajeConfirmacion.textContent = "Por favor, completa todos los campos.";
        mensajeConfirmacion.style.color = "tomato";
        return;
      }

      // Simula envío exitoso
      mensajeConfirmacion.textContent = "¡Mensaje enviado con éxito! Te responderemos pronto.";
      mensajeConfirmacion.style.color = "#e3b341";
      formContacto.reset();
    });
  }
});

// ==== ANIMACIÓN DE ENTRADA AL HACER SCROLL ====
const elementosAnimados = document.querySelectorAll('.fade-in');

const mostrarElemento = () => {
  const scrollY = window.scrollY + window.innerHeight * 0.85;

  elementosAnimados.forEach(el => {
    if (scrollY > el.offsetTop) {
      el.classList.add('visible');
    }
  });
};

window.addEventListener('scroll', mostrarElemento);

mostrarElemento(); // para cargar animaciones al entrar
});
//Supabase

// === IMPORTAR SUPABASE ===
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ======= CONFIGURACIÓN DE SUPABASE =======
const SUPABASE_URL = "https://mkxnfuegnoikadzjqosh.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1reG5mdWVnbm9pa2Fkempxb3NoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NzMzMDEsImV4cCI6MjA3ODQ0OTMwMX0.FrHjuW2ovfpAYtBp1n1iJ6m8VuPeVzOyR7Cyc3zwOgI";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ======= GENERAR HORAS AUTOMÁTICAMENTE =======
document.addEventListener("DOMContentLoaded", () => {

  const filtroHora = document.getElementById("filtroHora");
  const filtroFecha = document.getElementById("filtroFecha");
  if (!filtroHora || !filtroFecha) return;

  // --- Bloquear fechas pasadas ---
  const hoy = new Date().toISOString().split("T")[0];
  filtroFecha.min = hoy;

  const horas = [
    "11:00", "12:00", "13:00", "14:00", "15:00",
    "16:00", "17:00", "18:00", "19:00", "20:00", "21:00"
  ];

  function cargarHoras() {
    filtroHora.innerHTML = '<option value="">-- Selecciona hora --</option>';

    let horasDisponibles = horas;

    const fechaSeleccionada = filtroFecha.value;

    if (fechaSeleccionada === hoy) {
      const horaActual = new Date().getHours();

      horasDisponibles = horas.filter(h => {
        const hNum = parseInt(h.split(":")[0]);
        return hNum > horaActual; // Solo horas futuras
      });
    }

    horasDisponibles.forEach((hora) => {
      const opt = document.createElement("option");
      opt.value = hora;
      opt.textContent = hora;
      filtroHora.appendChild(opt);
    });
  }

  // Cargar horas al inicio
  cargarHoras();

  // Recalcular cuando cambia la fecha
  filtroFecha.addEventListener("change", cargarHoras);
});



// ======= SISTEMA DE MESAS Y RESERVAS =======
document.addEventListener("DOMContentLoaded", () => {

  console.log("✅ Script cargado correctamente");

  const btnBuscar = document.getElementById("btnBuscar");
  const contenedorMesas = document.getElementById("contenedorMesas");
  const formSection = document.getElementById("formReservaSection");
  const inputMesa = document.getElementById("mesaSeleccionada");
  const formReserva = document.getElementById("formReserva");

  if (!btnBuscar || !contenedorMesas) {
    console.error("❌ No se encontró el botón o el contenedor.");
    return;
  }

  // ===== MOSTRAR MESAS DISPONIBLES =====
  btnBuscar.addEventListener("click", async (e) => {
    e.preventDefault();
    console.log("Botón presionado ✅");

    const fecha = document.getElementById("filtroFecha").value;
    const hora = document.getElementById("filtroHora").value;

    if (!fecha || !hora) {
      alert("⚠️ Por favor selecciona fecha y hora primero.");
      return;
    }

    contenedorMesas.innerHTML = "<p>Cargando mesas...</p>";

    // 1️⃣ Traer mesas
    const { data: mesas, error: errMesas } = await supabase
      .from("restaurant_tables")
      .select("*")
      .order("numero", { ascending: true });

    if (errMesas) {
      contenedorMesas.innerHTML = `<p style="color:red;">Error: ${errMesas.message}</p>`;
      return;
    }

    // 2️⃣ Traer reservas de esa fecha y hora
    const { data: reservas, error: errRes } = await supabase
      .from("reservations")
      .select("mesa_id")
      .eq("fecha", fecha)
      .eq("hora", hora);

    if (errRes) {
      contenedorMesas.innerHTML = `<p style="color:red;">Error: ${errRes.message}</p>`;
      return;
    }

    const mesasOcupadas = reservas.map((r) => r.mesa_id);

    // 3️⃣ Mostrar mesas
    contenedorMesas.innerHTML = mesas
      .map(
        (m) => `
        <div class="mesa ${mesasOcupadas.includes(m.id) ? "ocupada" : "libre"}" data-id="${m.id}">
          <span>Mesa ${m.numero}</span>
          <small>${m.capacidad} personas</small>
        </div>`
      )
      .join("");

    // 4️⃣ Selección de mesa libre
    document.querySelectorAll(".mesa.libre").forEach((mesa) => {
      mesa.addEventListener("click", () => {
        document
          .querySelectorAll(".mesa")
          .forEach((m) => m.classList.remove("seleccionada"));

        mesa.classList.add("seleccionada");
        formSection.style.display = "flex";
        inputMesa.value = mesa.dataset.id;
      });
    });

  }); // ← Cierre del btnBuscar.addEventListener






  // ===== GUARDAR RESERVA =====
  formReserva.addEventListener("submit", async (e) => {
    e.preventDefault();

    const mesa_id = document.getElementById("mesaSeleccionada").value;
    const nombre = document.getElementById("nombre").value.trim();
    const email = document.getElementById("email").value.trim();
    const telefono = document.getElementById("telefono").value.trim();
    const mensaje = document.getElementById("mensaje").value.trim();
    const fecha = document.getElementById("filtroFecha").value;
    const hora = document.getElementById("filtroHora").value;

    if (!mesa_id || !fecha || !hora) {
      alert("⚠️ Selecciona una mesa, fecha y hora válidas.");
      return;
    }

    // 1️⃣ BUSCAR O CREAR CLIENTE
    let clienteId = null;

    const { data: clienteExistente, error: errorCliente } = await supabase
      .from("clientes")
      .select("*")
      .eq("correo_electronico", email)
      .maybeSingle();

    if (errorCliente) {
      console.error("❌ Error al buscar cliente:", errorCliente);
      alert("❌ Error al buscar cliente.");
      return;
    }

    if (clienteExistente) {
      clienteId = clienteExistente.id;
    } else {
      const { data: nuevoCliente, error: errorNuevo } = await supabase
        .from("clientes")
        .insert([
          {
            nombre,
            correo_electronico: email,
            telefono,
          },
        ])
        .select()
        .single();

      if (errorNuevo) {
        console.error("❌ Error al registrar cliente:", errorNuevo);
        alert("❌ No se pudo registrar el cliente.");
        return;
      }

      clienteId = nuevoCliente.id;
    }

    // 2️⃣ VALIDAR SI LA MESA ESTÁ OCUPADA
    const { data: reservaExistente } = await supabase
      .from("reservations")
      .select("*")
      .eq("mesa_id", mesa_id)
      .eq("fecha", fecha)
      .eq("hora", hora);

    if (reservaExistente.length > 0) {
      alert("⚠️ Esa mesa ya está reservada en ese horario.");
      return;
    }

    // 3️⃣ GUARDAR RESERVA
    const { error: errorReserva } = await supabase
      .from("reservations")
      .insert([
        {
          mesa_id,
          nombre,
          email,
          telefono,
          mensaje,
          fecha,
          hora,
          
        },
      ]);

    if (errorReserva) {
      console.error("❌ Error al guardar reserva:", errorReserva);
      alert("❌ No se pudo guardar la reserva.");
      return;
    }
    // ==============================
//  ENVIAR CORREO AL CLIENTE
// ==============================
// ========== ENVIAR CORREO DE CONFIRMACIÓN ==========
emailjs.init("tQdmZJrgUtfnJ0pOD");

emailjs.send("service_4ugtf3w", "template_khxnzfk", {
  nombre: nombre,
  email: email,
  fecha: fecha,
  hora: hora,
  mesa_id: mesa_id
})
.then((response) => {
  console.log("📩 Correo enviado:", response);
})
.catch((error) => {
  console.error("❌ Error al enviar correo:", error);
});


    // 4️⃣ MENSAJE DE ÉXITO
    const successMsg = document.createElement("div");
    successMsg.textContent = "✅ ¡Reserva y cliente registrados con éxito!";
    Object.assign(successMsg.style, {
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      background: "#4CAF50",
      color: "#fff",
      padding: "25px 50px",
      borderRadius: "12px",
      fontSize: "20px",
      fontWeight: "bold",
      textAlign: "center",
      boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
      zIndex: 2000,
      opacity: 0,
      transition: "opacity 0.5s ease",
    });

    document.body.appendChild(successMsg);
    setTimeout(() => (successMsg.style.opacity = 1), 100);
    setTimeout(() => {
      successMsg.style.opacity = 0;
      setTimeout(() => successMsg.remove(), 500);
    }, 2000);

    // Actualizar UI
    const mesaDiv = document.querySelector(`.mesa[data-id="${mesa_id}"]`);
    if (mesaDiv) {
      mesaDiv.classList.remove("libre");
      mesaDiv.classList.add("ocupada");
    }

    formReserva.reset();
    formSection.style.display = "none";
  });
// ===============================
//   HISTORIAL DE RESERVAS
// ===============================
/// ===============================
//   HISTORIAL DE RESERVAS
// ===============================
const emailInput = document.getElementById("emailHistorial");
const btnBuscarHistorial = document.getElementById("btnBuscarHistorial");
const resultadoHistorial = document.getElementById("resultadoHistorial");

if (emailInput && btnBuscarHistorial && resultadoHistorial) {
  btnBuscarHistorial.addEventListener("click", async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    if (!email.includes("@")) {
      resultadoHistorial.innerHTML =
        "<p style='color:#f9c74f'>⚠️ Ingresa un correo válido.</p>";
      return;
    }

    resultadoHistorial.innerHTML = "<p>🔄 Buscando reservas...</p>";

    try {
      // 1️⃣ Buscar cliente
      const { data: cliente, error: errorCliente } = await supabase
        .from("clientes")
        .select("*")
        .eq("correo_electronico", email)
        .single();

      if (errorCliente || !cliente) {
        resultadoHistorial.innerHTML =
          "<p>❌ No existe un cliente con ese correo.</p>";
        return;
      }

      // 2️⃣ Buscar reservas
      const { data: reservas, error: errorReservas } = await supabase
        .from("reservations")
        .select("*")
        .eq("email", email);

      if (errorReservas || !reservas || reservas.length === 0) {
        resultadoHistorial.innerHTML =
          "<p>❌ No tiene reservas registradas.</p>";
        return;
      }

      // 3️⃣ Construir HTML inicial (tu bloque original)
      let html = `
        <h3 style="color:#ffd166; margin-bottom:10px;">Historial de reservas:</h3>
        <div style="display:flex; flex-direction:column; gap:10px;">
      `;
reservas.forEach((r) => {

  // 🔍 Convertir fecha + hora a formato local
  const [year, month, day] = r.fecha.split("-");
  const [hour, minute] = r.hora.split(":");

  // Fecha/hora exacta de la reserva (en tu zona horaria)
  const fechaHoraReserva = new Date(
    year,
    month - 1,
    day,
    hour,
    minute,
    0
  );

  const ahora = new Date();

  const reservaPasada = fechaHoraReserva < ahora;

  html += `
    <div class="hist-item" data-id="${r.id}" style="background:#fff3; border-radius:10px; padding:10px; color:#fff;">
      👤 <strong>Cliente:</strong> ${cliente.nombre} <br>
      📅 <strong>Fecha:</strong> ${r.fecha} <br>
      🕒 <strong>Hora:</strong> ${r.hora} <br>
      🍽️ <strong>Mesa:</strong> ${r.mesa_id} <br>

      <div style="margin-top:10px; display:flex; gap:10px;">
        ${
          reservaPasada
            ? "<span style='color:#ccc; font-size:14px;'>⛔ Reserva finalizada</span>"
            : `
                <button class="hist-btn btn-edit" data-id="${r.id}">✏️ Editar</button>
                <button class="hist-btn btn-delete" data-id="${r.id}">🗑️ Eliminar</button>
              `
        }
      </div>
    </div>
  `;
});



      // 5️⃣ Tu cierre ORIGINAL tal cual estaba
      html += "</div>";
      resultadoHistorial.innerHTML = html;

      // 6️⃣ Listeners
      resultadoHistorial.querySelectorAll(".btn-edit").forEach((btn) => {
        btn.addEventListener("click", (ev) => {
          const id = ev.currentTarget.dataset.id;
          editarReserva(id);
        });
      });

      resultadoHistorial.querySelectorAll(".btn-delete").forEach((btn) => {
        btn.addEventListener("click", (ev) => {
          const id = ev.currentTarget.dataset.id;
          eliminarReserva(id);
        });
      });

    } catch (error) {
      console.error(error);
      resultadoHistorial.innerHTML =
        "<p style='color:red'>❌ Error al cargar el historial.</p>";
    }
  });
}
//eliminar reserva
async function eliminarReserva(id) {
  // 1️⃣ Confirmación bonita
  const { isConfirmed } = await Swal.fire({
    title: "¿Eliminar Reserva?",
    html: `
      <p style="font-size:16px; margin-top:8px;">
        Esta acción no se puede deshacer.<br>
        ¿Deseas continuar?
      </p>
    `,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Sí, eliminar",
    cancelButtonText: "Cancelar",

    // evita cierres accidentales
    allowOutsideClick: false,
    allowEscapeKey: false,
  });

  if (!isConfirmed) {
    Swal.fire("Cancelado", "La reserva no fue eliminada.", "info");
    return;
  }

  // 2️⃣ Obtener reserva para email
  const { data: reserva } = await supabase
    .from("reservations")
    .select("*")
    .eq("id", id)
    .single();

  if (!reserva) {
    Swal.fire("Error", "No se encontró la reserva.", "error");
    return;
  }

  // 3️⃣ Eliminar reserva
  const { error } = await supabase
    .from("reservations")
    .delete()
    .eq("id", id);

  if (error) {
    Swal.fire("Error", "No se pudo eliminar la reserva.", "error");
    return;
  }

  // 4️⃣ Enviar email de notificación
  emailjs.send("service_4ugtf3w", "template_2dcmtta", {
    email: reserva.email,
    nombre: reserva.nombre,
    fecha: reserva.fecha,
    hora: reserva.hora,
    mesa_id: reserva.mesa_id,
    accion: "eliminada",
  });

  // 5️⃣ Eliminar visualmente del historial
  const el = document.querySelector(`[data-id="${id}"]`);
  if (el) el.remove();

  // 6️⃣ Mensaje final bonito
  Swal.fire({
    title: "Reserva Eliminada",
    html: `
      <p style="font-size:16px;">
        ✔ Nombre: <b>${reserva.nombre}</b><br>
        ✔ Fecha: <b>${reserva.fecha}</b><br>
        ✔ Hora: <b>${reserva.hora}</b><br>
        ✔ Mesa: <b>${reserva.mesa_id}</b>
      </p>
    `,
    icon: "success",
    confirmButtonText: "OK",
  });
}



// =====================================
//  CONFIG — ENDPOINTS PARA EDITAR 
// =====================================
const API_URL = "https://mkxnfuegnoikadzjqosh.supabase.co/rest/v1";
const API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1reG5mdWVnbm9pa2Fkempxb3NoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NzMzMDEsImV4cCI6MjA3ODQ0OTMwMX0.FrHjuW2ovfpAYtBp1n1iJ6m8VuPeVzOyR7Cyc3zwOgI";

// 🔄 Conversión: Supabase → Input
function fechaParaInput(f) {
  // viene 2025-11-20
  return f;
}

// 🔄 Conversión: Input → Supabase
function fechaParaDB(f) {
  // viene 2025-11-20
  return f;
}


// =============================
//   EDITAR RESERVA COMPLETO
// =============================
async function editarReserva(id) {

  // 1️⃣ OBTENER RESERVA ORIGINAL
  const { data: reserva, error } = await supabase
    .from("reservations")
    .select("*")
    .eq("id", id)
    .single();

  if (!reserva) {
    Swal.fire("Error", "No se encontró la reserva.", "error");
    return;
  }


// 2️⃣ MODAL 1 — FECHA + HORA (con validaciones)
const hoy = new Date().toISOString().split("T")[0];
const horaActual = new Date().getHours();

const { value: datos } = await Swal.fire({
  title: "Editar Reserva",
  html: `
    <form id="formEditar">
      <label style="display:block;text-align:left;font-weight:bold;margin-bottom:4px;">📅 Fecha</label>
      <input id="nuevaFecha" type="date" class="swal2-input" value="${fechaParaInput(reserva.fecha)}" min="${hoy}">

      <label style="display:block;text-align:left;font-weight:bold;margin-top:15px;">🕒 Nueva Hora</label>
      <select id="nuevaHora" class="swal2-input"></select>
    </form>
  `,
  didOpen: () => {
    const selectHora = document.getElementById("nuevaHora");
    const inputFecha = document.getElementById("nuevaFecha");

    function cargarHorasEditar() {
      const fechaSel = inputFecha.value;
      let horas = [
        "11:00","12:00","13:00","14:00","15:00",
        "16:00","17:00","18:00","19:00","20:00","21:00"
      ];

      selectHora.innerHTML = "";

      // Si es hoy → solo horas futuras
      if (fechaSel === hoy) {
        horas = horas.filter(h => {
          const hNum = parseInt(h.split(":")[0]);
          return hNum > horaActual;
        });
      }

      // Render opciones
      horas.forEach(h => {
        const opt = document.createElement("option");
        opt.value = h;
        opt.textContent = h;

        if (h === reserva.hora) opt.selected = true;
        selectHora.appendChild(opt);
      });
    }

    // Cargar horas inicial
    cargarHorasEditar();

    // Recalcular si cambia la fecha
    inputFecha.addEventListener("change", cargarHorasEditar);
  },
  focusConfirm: false,
  confirmButtonText: "Buscar mesas",
  preConfirm: () => {
    const nuevaFecha = document.getElementById("nuevaFecha").value;
    const nuevaHora = document.getElementById("nuevaHora").value;

    if (!nuevaFecha) {
      Swal.showValidationMessage("Debes seleccionar una fecha válida");
      return false;
    }
    if (!nuevaHora) {
      Swal.showValidationMessage("Debes seleccionar una hora válida");
      return false;
    }

    return { fecha: nuevaFecha, hora: nuevaHora };
  }
});


  if (!datos) return;

  const fechaNueva = fechaParaDB(datos.fecha);
  const horaNueva = datos.hora;



  // 3️⃣ CONSULTAR MESAS YA RESERVADAS
  const { data: ocupadas } = await supabase
    .from("reservations")
    .select("mesa_id")
    .eq("fecha", fechaNueva)
    .eq("hora", horaNueva);

  const mesasOcupadas = ocupadas.map(m => Number(m.mesa_id));


  // 4️⃣ OBTENER TODAS LAS MESAS
  const { data: mesas } = await supabase
    .from("restaurant_tables")
    .select("*");

  const mesasLibres = mesas.filter(m => !mesasOcupadas.includes(m.id));

  if (mesasLibres.length === 0) {
    Swal.fire("Sin mesas", "No hay mesas disponibles.", "warning");
    return;
  }
 
console.log("ocupadas:", mesasOcupadas);
console.log("todas las mesas:", mesas);
console.log("mesasLibres:", mesasLibres);

  // 5️⃣ MODAL 2 — ELEGIR MESA DISPONIBLE
// 5️⃣ MODAL 2 — ELEGIR MESA DISPONIBLE
console.log("mesasLibres:", mesasLibres);

const opcionesHTML = mesasLibres
  .map(m => `
    <option value="${m.id}">
      Mesa ${m.numero} — (${m.capacidad} personas)
    </option>
  `)
  .join("");

console.log("opcionesHTML generado:", opcionesHTML);

const { value: mesaElegida, dismiss } = await Swal.fire({
  title: "Seleccionar Mesa",
  html: `
    <div style="text-align:left; margin-top:10px;">
      <label style="font-weight:bold; display:block; margin-bottom:6px;">
        Mesas disponibles
      </label>

      <select id="mesaSelect" style="
        width:100%;
        padding:12px;
        border-radius:5px;
        border:1px solid #ccc;
        font-size:16px;
      ">
        ${opcionesHTML}
      </select>
    </div>
  `,
  showCancelButton: true,
  cancelButtonText: "Cancelar",
  confirmButtonText: "Actualizar reserva",

  // ❌ Evita que el modal se cierre al hacer clic afuera
  allowOutsideClick: false,
  allowEscapeKey: false,

  focusConfirm: false,
  preConfirm: () => {
    const sel = document.getElementById("mesaSelect").value;

    if (!sel) {
      Swal.showValidationMessage("Debes seleccionar una mesa");
      return false;
    }

    return sel;
  },
  didOpen: () => {
    const sel = document.getElementById("mesaSelect");
    if (sel) sel.style.display = "block"; // evita que Swal lo esconda
  }
});

// 🔴 Si el usuario canceló → detenemos todo
if (dismiss === Swal.DismissReason.cancel) {
  Swal.fire("Cancelado", "No se realizaron cambios.", "info");
  return;
}




  // 6️⃣ ACTUALIZAR EN SUPABASE
  const { error: errUpdate } = await supabase
    .from("reservations")
    .update({
      fecha: fechaNueva,
      hora: horaNueva,
      mesa_id: mesaElegida
    })
    .eq("id", id);

  if (errUpdate) {
    Swal.fire("Error", "No se pudo actualizar.", "error");
    return;
  }


  // 7️⃣ EMAIL
  emailjs.send("service_4ugtf3w", "template_2dcmtta", {
    email: reserva.email,
    nombre: reserva.nombre,
    fecha: fechaNueva,
    hora: horaNueva,
    mesa_id: mesaElegida,
    accion: "editada"
  });


  // 8️⃣ CONFIRMACIÓN
  Swal.fire(
    "Reserva Actualizada",
    `
      ✔ Fecha: ${fechaNueva}<br>
      ✔ Hora: ${horaNueva}<br>
      ✔ Mesa: ${mesaElegida}
    `,
    "success"
  );
}
});
