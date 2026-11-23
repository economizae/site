/**
 * Economizaê — Interatividade, Preview Ao Vivo e Rastreamento de Conversão
 */
(function () {
  "use strict";

  const CFG = window.ECONOMIZAE_CONFIG || {};
  const WA_URL = CFG.whatsappUrl || "#";
  const TG_URL = CFG.telegramUrl || "#";

  // -------------------------------------------------------------------------
  // 1. Captura de UTMs (útil para campanhas Meta Ads / TikTok / Google)
  // -------------------------------------------------------------------------
  function lerUtms() {
    const params = new URLSearchParams(window.location.search);
    const utms = {};
    ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "gclid"].forEach((k) => {
      const v = params.get(k);
      if (v) utms[k] = v;
    });
    return utms;
  }

  const UTMS = lerUtms();

  // -------------------------------------------------------------------------
  // 2. Pixels Opcionais (Meta Pixel, GA4, TikTok Pixel)
  // -------------------------------------------------------------------------
  function iniciarPixels() {
    if (CFG.metaPixelId) {
      !(function (f, b, e, v, n, t, s) {
        if (f.fbq) return;
        n = f.fbq = function () {
          n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n;
        n.push = n;
        n.loaded = !0;
        n.version = "2.0";
        n.queue = [];
        t = b.createElement(e);
        t.async = !0;
        t.src = v;
        s = b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t, s);
      })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
      window.fbq("init", CFG.metaPixelId);
      window.fbq("track", "PageView");
    }

    if (CFG.ga4Id) {
      const s = document.createElement("script");
      s.async = true;
      s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(CFG.ga4Id);
      document.head.appendChild(s);
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () {
        window.dataLayer.push(arguments);
      };
      window.gtag("js", new Date());
      window.gtag("config", CFG.ga4Id);
    }

    if (CFG.tiktokPixelId) {
      !(function (w, d, t) {
        w.TiktokAnalyticsObject = t;
        const ttq = (w[t] = w[t] || []);
        ttq.methods = ["page", "track", "identify", "instances", "load", "ready"];
        ttq.setAndDefer = function (t, e) {
          t[e] = function () {
            t.push([e].concat(Array.prototype.slice.call(arguments, 0)));
          };
        };
        for (let i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
        ttq.load = function (e) {
          const n = d.createElement("script");
          n.type = "text/javascript";
          n.async = true;
          n.src = "https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=" + encodeURIComponent(e) + "&lib=" + t;
          const a = d.getElementsByTagName("script")[0];
          a.parentNode.insertBefore(n, a);
        };
        ttq.load(CFG.tiktokPixelId);
        ttq.page();
      })(window, document, "ttq");
    }
  }

  function registrarConversao(canal, origem) {
    const payload = Object.assign({ channel: canal, placement: origem }, UTMS);
    if (typeof window.fbq === "function") {
      window.fbq("track", "Lead", { content_name: "Economizae_" + canal, content_category: origem });
    }
    if (typeof window.gtag === "function") {
      window.gtag("event", "generate_lead", {
        event_category: "grupo_ofertas",
        event_label: canal + "_" + origem,
        channel: canal,
        placement: origem
      });
    }
    if (window.ttq && typeof window.ttq.track === "function") {
      window.ttq.track("SubmitForm", payload);
    }
  }

  // -------------------------------------------------------------------------
  // 3. Vincular Links de WhatsApp e Telegram em toda a página
  // -------------------------------------------------------------------------
  function vincularLinksCanais() {
    document.querySelectorAll("[data-channel]").forEach((el) => {
      const canal = el.getAttribute("data-channel");
      const origem = el.getAttribute("data-placement") || "geral";
      const url = canal === "telegram" ? TG_URL : WA_URL;

      if (el.tagName === "A") {
        el.setAttribute("href", url);
        el.setAttribute("target", "_blank");
        el.setAttribute("rel", "noopener noreferrer");
      }

      el.addEventListener("click", function () {
        registrarConversao(canal, origem);
      });
    });
  }

  // -------------------------------------------------------------------------
  // 4. Status Ao Vivo no Horário de Brasília (08h-23h Zap / 24h Telegram)
  // -------------------------------------------------------------------------
  function atualizarStatusAoVivo() {
    const dot = document.getElementById("liveStatusDot");
    const txt = document.getElementById("liveStatusText");
    if (!dot || !txt) return;

    let horaBr = new Date().getHours();
    try {
      const fmt = new Intl.DateTimeFormat("pt-BR", {
        timeZone: "America/Sao_Paulo",
        hour: "2-digit",
        hour12: false
      });
      horaBr = parseInt(fmt.format(new Date()), 10);
    } catch (_) {
      // fallback para horário local
    }

    const pausaNoturna = horaBr >= 23 || horaBr < 8;
    if (pausaNoturna) {
      dot.classList.add("pulse-dot--night");
      txt.textContent = "WhatsApp em modo silencioso (retoma às 08h) • Canal Telegram enviando ofertas 24h!";
    } else {
      dot.classList.remove("pulse-dot--night");
      txt.textContent = "Grupo ativo agora! Ofertas e cupons saindo hoje no WhatsApp e Telegram.";
    }
  }

  // -------------------------------------------------------------------------
  // 5. Mockup Interativo do Celular (WhatsApp VIP <-> Telegram 24h)
  // -------------------------------------------------------------------------
  const PREVIEWS = {
    whatsapp: {
      name: "Economizaê | Ofertas VIP",
      sub: "Grupo fechado • Só ofertas reais",
      tag: "08h–23h",
      footer: "🔒 Somente administradores enviam mensagens — zero spam!",
      msgs: [
        {
          badge: "-58% OFF",
          store: "Mercado Livre",
          product: "🎧 Fone Bluetooth TWS Cancelamento de Ruído + Case",
          oldPrice: "R$ 179,00",
          newPrice: "R$ 74,90",
          coupon: "🎟️ Envio Full • Entrega Rápida",
          link: "mercadolivre.com.br/oferta-verificada",
          time: "14:22"
        },
        {
          badge: "-46% OFF",
          store: "Shopee Oficial",
          product: "🍳 Air Fryer 4L Antiaderente com Timer 1500W",
          oldPrice: "R$ 349,90",
          newPrice: "R$ 189,90",
          coupon: "🎟️ Cupom + Frete Grátis no App",
          link: "s.shopee.com.br/achadinho-do-dia",
          time: "15:08"
        }
      ]
    },
    telegram: {
      name: "Economizaê Achadinhos",
      sub: "Canal oficial • Feed ao vivo 24h",
      tag: "24h LIVE",
      footer: "✈️ Histórico completo de ofertas e alertas instantâneos 24h",
      msgs: [
        {
          badge: "-46% OFF",
          store: "Amazon Brasil",
          product: "🔊 Echo Pop Smart Speaker Compacto com Alexa",
          oldPrice: "R$ 349,00",
          newPrice: "R$ 189,00",
          coupon: "⚡ Entrega Prime • Oferta do Dia",
          link: "amzn.to/achadinho-amazon",
          time: "16:04"
        },
        {
          badge: "-56% OFF",
          store: "Shopee Oficial",
          product: "☕ Garrafa Térmica Inox Parede Dupla 1 Litro",
          oldPrice: "R$ 159,90",
          newPrice: "R$ 69,90",
          coupon: "⚡ Oferta Relâmpago • Estoque Limitado",
          link: "s.shopee.com.br/economia-de-verdade",
          time: "16:19"
        }
      ]
    }
  };

  function iniciarPreviewCelular() {
    const screen = document.getElementById("phoneScreen");
    const nameEl = document.getElementById("phoneGroupName");
    const subEl = document.getElementById("phoneGroupSub");
    const tagEl = document.getElementById("phoneGroupTag");
    const chatEl = document.getElementById("phoneChat");
    const footEl = document.getElementById("phoneFooterNote");
    const buttons = document.querySelectorAll(".channel-switch__btn");

    if (!screen || !chatEl) return;

    function renderizar(modo) {
      const dados = PREVIEWS[modo] || PREVIEWS.whatsapp;
      screen.setAttribute("data-mode", modo);
      nameEl.textContent = dados.name;
      subEl.textContent = dados.sub;
      tagEl.textContent = dados.tag;
      footEl.textContent = dados.footer;

      buttons.forEach((btn) => {
        const ativo = btn.getAttribute("data-preview") === modo;
        btn.classList.toggle("is-active", ativo);
        btn.setAttribute("aria-selected", ativo ? "true" : "false");
      });

      chatEl.innerHTML =
        '<div class="chat-date">HOJE</div>' +
        dados.msgs
          .map(
            (m) => `
          <div class="chat-bubble">
            <div class="chat-bubble__top">
              <span class="chat-badge">${escapeHtml(m.badge)}</span>
              <span class="chat-store">${escapeHtml(m.store)}</span>
            </div>
            <div class="chat-product">${escapeHtml(m.product)}</div>
            <div class="chat-prices">
              <span class="chat-old">${escapeHtml(m.oldPrice)}</span>
              <span class="chat-new">${escapeHtml(m.newPrice)}</span>
            </div>
            <div class="chat-coupon">${escapeHtml(m.coupon)}</div>
            <span class="chat-link">🔗 ${escapeHtml(m.link)}</span>
            <span class="chat-time">${escapeHtml(m.time)} ✓✓</span>
          </div>`
          )
          .join("");
    }

    buttons.forEach((btn) => {
      btn.addEventListener("click", () => renderizar(btn.getAttribute("data-preview")));
    });

    renderizar("whatsapp");
  }

  // -------------------------------------------------------------------------
  // 6. Vitrine Interativa de Exemplos de Achadinhos
  // -------------------------------------------------------------------------
  function iniciarVitrine() {
    const grid = document.getElementById("dealsGrid");
    const pills = document.querySelectorAll(".filter-pill");
    const ofertas = Array.isArray(CFG.ofertasExemplo) ? CFG.ofertasExemplo : [];
    if (!grid) return;

    const corDot = {
      shopee: "store-dot--shopee",
      mercadolivre: "store-dot--ml",
      amazon: "store-dot--amazon"
    };

    function renderizar(filtro) {
      const lista = filtro === "todas" ? ofertas : ofertas.filter((o) => o.chaveLoja === filtro);

      grid.innerHTML = lista
        .map(
          (o) => `
        <article class="deal-card">
          <div class="deal-card__top">
            <span class="deal-card__store">
              <span class="store-dot ${corDot[o.chaveLoja] || ""}"></span>
              ${escapeHtml(o.loja)}
            </span>
            <span class="deal-card__off">${escapeHtml(o.desconto)}</span>
          </div>
          <div class="deal-card__body">
            <div class="deal-card__thumb" aria-hidden="true">${escapeHtml(o.icone)}</div>
            <div>
              <div class="deal-card__cat">${escapeHtml(o.categoria)}</div>
              <h3 class="deal-card__title">${escapeHtml(o.titulo)}</h3>
            </div>
          </div>
          <div class="deal-card__pricing">
            <div>
              <span class="deal-card__old">${escapeHtml(o.precoAntigo)}</span>
              <span class="deal-card__now">${escapeHtml(o.precoAtual)}</span>
            </div>
            <span class="deal-card__save">${escapeHtml(o.economia)}</span>
          </div>
          <div class="deal-card__footer">
            <span class="deal-card__coupon">🎟️ ${escapeHtml(o.cupom)}</span>
            <a class="deal-card__cta" href="${escapeHtml(WA_URL)}" target="_blank" rel="noopener noreferrer" data-channel="whatsapp" data-placement="vitrine_${escapeHtml(o.chaveLoja)}">
              Receber no Zap →
            </a>
          </div>
        </article>`
        )
        .join("");

      // Vincular eventos de tracking aos novos links renderizados
      grid.querySelectorAll("[data-channel]").forEach((link) => {
        link.addEventListener("click", function () {
          registrarConversao(link.getAttribute("data-channel"), link.getAttribute("data-placement"));
        });
      });
    }

    pills.forEach((pill) => {
      pill.addEventListener("click", () => {
        pills.forEach((p) => p.classList.remove("is-active"));
        pill.classList.add("is-active");
        renderizar(pill.getAttribute("data-filter"));
      });
    });

    renderizar("todas");
  }

  // -------------------------------------------------------------------------
  // 7. FAQ Accordion
  // -------------------------------------------------------------------------
  function iniciarFaq() {
    const items = document.querySelectorAll(".faq-item");
    items.forEach((item) => {
      const btn = item.querySelector(".faq-question");
      const ans = item.querySelector(".faq-answer");
      if (!btn || !ans) return;

      btn.addEventListener("click", () => {
        const aberto = item.classList.contains("is-open");
        items.forEach((outro) => {
          outro.classList.remove("is-open");
          const oBtn = outro.querySelector(".faq-question");
          const oAns = outro.querySelector(".faq-answer");
          if (oBtn) oBtn.setAttribute("aria-expanded", "false");
          if (oAns) oAns.style.maxHeight = null;
        });

        if (!aberto) {
          item.classList.add("is-open");
          btn.setAttribute("aria-expanded", "true");
          ans.style.maxHeight = ans.scrollHeight + "px";
        }
      });
    });
  }

  // -------------------------------------------------------------------------
  // 8. Barra Fixa Mobile (aparece só quando o botão do topo sai da tela)
  // -------------------------------------------------------------------------
  function iniciarStickyBar() {
    const bar = document.getElementById("stickyBar");
    const heroCta = document.getElementById("heroCta");
    const finalCta = document.getElementById("finalCta");
    if (!bar || !heroCta || typeof IntersectionObserver === "undefined") return;

    let heroVisivel = true;
    let finalVisivel = false;

    const atualizar = () => {
      const mostrar = !heroVisivel && !finalVisivel;
      bar.classList.toggle("is-visible", mostrar);
      bar.setAttribute("aria-hidden", mostrar ? "false" : "true");
    };

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target === heroCta) heroVisivel = entry.isIntersecting;
          if (entry.target === finalCta) finalVisivel = entry.isIntersecting;
        });
        atualizar();
      },
      { threshold: 0.1 }
    );

    obs.observe(heroCta);
    if (finalCta) obs.observe(finalCta);
  }

  // -------------------------------------------------------------------------
  // 9. Compartilhar Página & Modal de Privacidade/Termos
  // -------------------------------------------------------------------------
  function mostrarToast(msg) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("is-show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.remove("is-show"), 2600);
  }

  function iniciarCompartilhar() {
    const btn = document.getElementById("btnShare");
    if (!btn) return;
    btn.addEventListener("click", async () => {
      const shareData = {
        title: "Economizaê — Achadinhos e Ofertas",
        text: "Entra nesse grupo grátis de ofertas e cupons da Shopee, Mercado Livre e Amazon!",
        url: window.location.href
      };
      if (navigator.share) {
        try {
          await navigator.share(shareData);
          return;
        } catch (_) {
          // usuário cancelou ou não suportado
        }
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
          await navigator.clipboard.writeText(window.location.href);
          mostrarToast("✅ Link copiado! Agora é só colar e mandar pros amigos.");
          return;
        } catch (_) {}
      }
      mostrarToast("Copie o endereço da barra do navegador para compartilhar!");
    });
  }

  function iniciarModais() {
    const modal = document.getElementById("legalModal");
    const title = document.getElementById("legalModalTitle");
    const body = document.getElementById("legalModalBody");
    const closeBtn = document.getElementById("legalModalClose");
    if (!modal || !title || !body) return;

    const conteudos = {
      privacidade: {
        titulo: "Política de Privacidade",
        html: `
          <p>O <strong>Economizaê — Achadinhos e Ofertas</strong> respeita a sua privacidade. Esta página não coleta senhas, dados bancários ou informações pessoais sensíveis.</p>
          <p>Ao tocar nos botões de convite, você é direcionado diretamente aos aplicativos oficiais do <strong>WhatsApp</strong> ou <strong>Telegram</strong>, onde poderá entrar ou sair da comunidade quando desejar.</p>
          <p>Podemos utilizar cookies estatísticos anônimos (como Meta Pixel ou Google Analytics) apenas para medir a performance das campanhas e melhorar a qualidade das ofertas divulgadas.</p>
        `
      },
      termos: {
        titulo: "Termos de Uso e Aviso de Afiliado",
        html: `
          <p>O <strong>Economizaê</strong> atua como um canal independente de curadoria e divulgação de promoções, descontos e cupons encontrados nas principais lojas online (como Shopee, Mercado Livre e Amazon).</p>
          <p><strong>Participação em programas de afiliados:</strong> alguns links compartilhados nos grupos podem gerar uma pequena comissão para manter o projeto 100% gratuito, sem nenhum acréscimo no valor pago por você.</p>
          <p>Todas as compras, pagamentos, entregas e garantias são realizados exclusivamente dentro dos sites ou aplicativos oficiais de cada loja. Preços, estoques e cupons são dinâmicos e podem sofrer alteração a qualquer momento pela loja anunciante.</p>
        `
      }
    };

    function abrir(tipo) {
      const c = conteudos[tipo];
      if (!c) return;
      title.textContent = c.titulo;
      body.innerHTML = c.html;
      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
    }

    function fechar() {
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
    }

    document.querySelectorAll("[data-modal]").forEach((btn) => {
      btn.addEventListener("click", () => abrir(btn.getAttribute("data-modal")));
    });

    if (closeBtn) closeBtn.addEventListener("click", fechar);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) fechar();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") fechar();
    });
  }

  function atualizarAno() {
    const el = document.getElementById("currentYear");
    if (el) el.textContent = String(new Date().getFullYear());
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // Inicialização
  document.addEventListener("DOMContentLoaded", function () {
    iniciarPixels();
    vincularLinksCanais();
    atualizarStatusAoVivo();
    iniciarPreviewCelular();
    iniciarVitrine();
    iniciarFaq();
    iniciarStickyBar();
    iniciarCompartilhar();
    iniciarModais();
    atualizarAno();
  });
})();
