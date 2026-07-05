/* ==========================================================================
   jmg.systems — front page behavior
   Pointer parallax · grid sparks · scroll-recede fallback.
   All motion is disabled under prefers-reduced-motion: reduce (parallax and
   sparks here in JS; ticker and scanline in CSS).
   ========================================================================== */
(function () {
  'use strict';

  /* partnering clock — precise duration since 1/2011 */
  (function () {
    var el = document.getElementById('est-clock');
    if (!el) return;
    var s = new Date(2011, 0, 1), n = new Date();
    var y = n.getFullYear() - s.getFullYear();
    var m = n.getMonth() - s.getMonth();
    var d = n.getDate() - s.getDate();
    if (d < 0) { m--; d += new Date(n.getFullYear(), n.getMonth(), 0).getDate(); }
    if (m < 0) { y--; m += 12; }
    el.textContent = 'Partnering with small businesses for ' + y + ' years, ' + m + ' months, ' + d + ' days';
  })();

  /* rev stamp — click for the (very) simple revision table */
  (function () {
    var btn = document.getElementById('rev-btn');
    var tbl = document.getElementById('rev-table');
    if (!btn || !tbl) return;
    btn.addEventListener('click', function () {
      var open = tbl.hidden;
      tbl.hidden = !open;
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  })();

  /* kaizen easter egg: type "improve" anywhere -> spark burst */
  (function () {
    var buf = '';
    document.addEventListener('keydown', function (e) {
      if (!e.key || e.key.length !== 1) return;
      buf = (buf + e.key.toLowerCase()).slice(-7);
      if (buf === 'improve') {
        buf = '';
        document.dispatchEvent(new CustomEvent('jmg-improve'));
      }
    });
  })();

  /* services: fold-out drawers on mobile (CSS scopes the collapse; on desktop
     the class toggle is inert) */
  (function () {
    var rows = document.querySelectorAll('.svc-row');
    rows.forEach(function (row, i) {
      var head = row.querySelector('.svc-head');
      if (!head) return;
      if (i === 0) row.classList.add('open');
      head.setAttribute('role', 'button');
      head.setAttribute('tabindex', '0');
      head.setAttribute('aria-expanded', i === 0 ? 'true' : 'false');
      function tog() {
        var open = row.classList.toggle('open');
        head.setAttribute('aria-expanded', open ? 'true' : 'false');
      }
      head.addEventListener('click', tog);
      head.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tog(); }
      });
    });
  })();

  /* mobile menu: close after a nav link is tapped (same-page anchors) */
  document.querySelectorAll('header.site nav a').forEach(function (a) {
    a.addEventListener('click', function () {
      var t = document.getElementById('nav-toggle');
      if (t) t.checked = false;
    });
  });

  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ===== Pointer parallax =====
     Scene: [data-plx-scene]. Layers: [data-plx="depth"] — higher depth = moves more.
     Layers translate OPPOSITE the cursor by depth * normalized offset; the .plx
     0.4s ease (CSS) smooths the lag. Reset to 0 on pointerleave. */
  if (!reduceMotion) {
    document.querySelectorAll('[data-plx-scene]').forEach(function (scene) {
      scene.addEventListener('pointermove', function (e) {
        var r = scene.getBoundingClientRect();
        var dx = (e.clientX - r.left) / r.width - 0.5;
        var dy = (e.clientY - r.top) / r.height - 0.5;
        scene.querySelectorAll('[data-plx]').forEach(function (el) {
          var d = parseFloat(el.getAttribute('data-plx')) || 0;
          el.style.transform = 'translate(' + (-dx * d).toFixed(1) + 'px,' + (-dy * d).toFixed(1) + 'px)';
        });
      });
      scene.addEventListener('pointerleave', function () {
        scene.querySelectorAll('[data-plx]').forEach(function (el) {
          el.style.transform = 'translate(0,0)';
        });
      });
    });
  }

  /* ===== Grid sparks =====
     Exactly 2 sparks travel along the 24px grid lines: 1px fading gradient tail
     + a sharp 2.5px square head. Slow (0.35-0.75 px/frame). ~12% of sparks are
     ochre; the rest blueprint blue. Respawn on exit. */
  (function () {
    var cv = document.getElementById('spark-canvas');
    if (!cv) return;
    var ctx = cv.getContext('2d');
    if (!ctx) return;

    var W, H, COLS, ROWS;
    var CELL = 24;

    /* ghost mark — drawn on its own canvas so ripples can shear it in strips */
    var mcv = document.getElementById('mark-canvas');
    var mctx = mcv ? mcv.getContext('2d') : null;
    var mark = new Image();
    var markReady = false;
    mark.onload = function () { markReady = true; if (reduceMotion) statics(); };
    mark.src = '/assets/mark-inverse.png';

    function size() {
      W = cv.width = cv.offsetWidth;
      H = cv.height = cv.offsetHeight;
      COLS = Math.floor(W / CELL);
      ROWS = Math.floor(H / CELL);
      if (mcv) { mcv.width = mcv.offsetWidth; mcv.height = mcv.offsetHeight; }
      if (reduceMotion) statics();
    }

    /* ===== pointer ripple field ("moving through the matrix") =====
       pointermove drops expanding wavefronts; grid lines and the ghost mark
       displace radially where a wavefront passes. Foreground DOM never moves. */
    var ripples = [];
    var lastRX = -1e4, lastRY = -1e4;
    var LIFE = 900;
    var scene = document.querySelector('[data-plx-scene]');
    if (scene && !reduceMotion) {
      scene.addEventListener('pointermove', function (e) {
        var r = cv.getBoundingClientRect();
        var x = e.clientX - r.left, y = e.clientY - r.top;
        if (Math.hypot(x - lastRX, y - lastRY) < 26) return;
        lastRX = x; lastRY = y;
        ripples.push({ x: x, y: y, t: performance.now() });
        if (ripples.length > 14) ripples.shift();
      });
    }
    function disp(x, y, now) {
      var dx = 0, dy = 0;
      for (var i = 0; i < ripples.length; i++) {
        var rp = ripples[i];
        var age = (now - rp.t) / LIFE;
        if (age >= 1) continue;
        var ax = x - rp.x, ay = y - rp.y;
        var d = Math.sqrt(ax * ax + ay * ay) || 1;
        var ring = 30 + age * 240;         /* expanding wavefront */
        var g = (d - ring) / 55;
        var k = Math.exp(-g * g) * (1 - age) * 15;
        dx += (ax / d) * k; dy += (ay / d) * k;
      }
      return [dx, dy];
    }
    function pruneRipples(now) {
      while (ripples.length && now - ripples[0].t >= LIFE) ripples.shift();
    }

    /* grid now lives on this canvas (CSS grid div is hidden) so it can warp */
    var GRID_COL = 'rgba(58,111,160,0.11)';
    function drawGrid(now) {
      ctx.strokeStyle = GRID_COL;
      ctx.lineWidth = 1;
      var live = ripples.length > 0;
      var x, y, p;
      for (x = 0.5; x <= W; x += CELL) {
        ctx.beginPath();
        if (!live) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
        else {
          for (y = 0; y <= H + 18; y += 18) {
            p = disp(x, y, now);
            if (y === 0) ctx.moveTo(x + p[0], y + p[1]); else ctx.lineTo(x + p[0], y + p[1]);
          }
        }
        ctx.stroke();
      }
      for (y = 0.5; y <= H; y += CELL) {
        ctx.beginPath();
        if (!live) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
        else {
          for (x = 0; x <= W + 18; x += 18) {
            p = disp(x, y, now);
            if (x === 0) ctx.moveTo(x + p[0], y + p[1]); else ctx.lineTo(x + p[0], y + p[1]);
          }
        }
        ctx.stroke();
      }
    }

    function drawMark(now) {
      if (!mctx || !markReady) return;
      var MW = mcv.width, MH = mcv.height;
      mctx.clearRect(0, 0, MW, MH);
      var dw = Math.min(660, MW * 0.6);
      var dh = dw * (mark.naturalHeight / mark.naturalWidth);
      var mx = MW - dw + 130;
      var my = (MH - dh) * 0.45;
      mctx.globalAlpha = 0.07;
      var strip = 8;
      var sh = mark.naturalHeight * (strip / dh);
      for (var yy = 0; yy < dh; yy += strip) {
        /* +60 maps mark-layer coords into the grid layer's -60px-inset space */
        var p = disp(mx + dw / 2 + 60, my + yy + 60, now);
        mctx.drawImage(mark,
          0, mark.naturalHeight * (yy / dh), mark.naturalWidth, sh,
          mx + p[0] * 0.8, my + yy + p[1] * 0.25, dw, strip);
      }
      mctx.globalAlpha = 1;
    }

    function statics() {
      if (!W) return;
      ctx.clearRect(0, 0, W, H);
      drawGrid(0);
      drawMark(0);
    }

    size();
    window.addEventListener('resize', size);

    function mk() {
      var horiz = Math.random() < 0.5;
      return {
        horiz: horiz,
        line: (horiz ? (1 + Math.floor(Math.random() * (ROWS - 1))) : (1 + Math.floor(Math.random() * (COLS - 1)))) * CELL,
        pos: Math.random() * (horiz ? W : H),
        dir: Math.random() < 0.5 ? 1 : -1,
        v: 0.35 + Math.random() * 0.4,
        ochre: Math.random() < 0.12,
        len: 26 + Math.random() * 34
      };
    }

    var sparks = [mk(), mk()];

    /* kaizen burst: a dozen fast sparks (some white, some ochre) on demand */
    var burst = [];
    document.addEventListener('jmg-improve', function () {
      for (var i = 0; i < 12; i++) {
        var b = mk();
        b.v = 1.6 + Math.random() * 1.4;
        b.len = 40 + Math.random() * 50;
        if (i % 3 === 0) b.white = true;
        else if (i % 3 === 1) b.ochre = true;
        burst.push(b);
      }
    });

    /* Occasional white flare: larger, ~2x faster, brighter, with a flickering
       head — an event, not a pattern. One at a time, every ~10-15s. */
    var flare = null;
    var nextFlareAt = performance.now() + 5000 + Math.random() * 5000;
    function mkFlare() {
      var s = mk();
      s.v = 1.2 + Math.random() * 0.6;
      s.len = 50 + Math.random() * 40;
      s.white = true;
      return s;
    }

    function draw(s, now) {
      s.pos += s.v * s.dir;
      if (s.pos < -s.len || s.pos > (s.horiz ? W : H) + s.len) return false;
      var col = s.white ? '232,238,246' : (s.ochre ? '225,169,86' : '125,166,211');
      var tail = ctx.createLinearGradient(
        s.horiz ? s.pos - s.dir * s.len : s.line, s.horiz ? s.line : s.pos - s.dir * s.len,
        s.horiz ? s.pos : s.line, s.horiz ? s.line : s.pos
      );
      tail.addColorStop(0, 'rgba(' + col + ',0)');
      tail.addColorStop(1, 'rgba(' + col + ',' + (s.white ? '0.7' : '0.55') + ')');
      ctx.strokeStyle = tail;
      ctx.lineWidth = s.white ? 1.5 : 1;
      ctx.beginPath();
      if (s.horiz) { ctx.moveTo(s.pos - s.dir * s.len, s.line + 0.5); ctx.lineTo(s.pos, s.line + 0.5); }
      else { ctx.moveTo(s.line + 0.5, s.pos - s.dir * s.len); ctx.lineTo(s.line + 0.5, s.pos); }
      ctx.stroke();
      /* head — white flare flickers ("sparks") via fast alpha oscillation */
      var headA = s.white ? (0.7 + 0.3 * Math.abs(Math.sin(now * 0.02))) : 0.95;
      var sz = s.white ? 3.5 : 2.5;
      ctx.fillStyle = 'rgba(' + col + ',' + headA.toFixed(2) + ')';
      if (s.horiz) ctx.fillRect(s.pos - sz / 2, s.line - sz / 2, sz, sz);
      else ctx.fillRect(s.line - sz / 2, s.pos - sz / 2, sz, sz);
      return true;
    }

    if (reduceMotion) {
      statics();
    } else {
      (function step(now) {
        ctx.clearRect(0, 0, W, H);
        pruneRipples(now);
        drawGrid(now);
        drawMark(now);
        for (var i = 0; i < sparks.length; i++) {
          if (!draw(sparks[i], now)) sparks[i] = mk();
        }
        for (var bi = burst.length - 1; bi >= 0; bi--) {
          if (!draw(burst[bi], now)) burst.splice(bi, 1);
        }
        if (!flare && now >= nextFlareAt) flare = mkFlare();
        if (flare && !draw(flare, now)) {
          flare = null;
          nextFlareAt = now + 9000 + Math.random() * 6000;
        }
        requestAnimationFrame(step);
      })(performance.now());
    }
  })();

  /* ===== 3D word graph (hero backdrop) =====
     Obsidian-style node graph: ~24 words from the JMG vocabulary on a
     fibonacci sphere, semantic edges, perspective projection on canvas 2D.
     Slow idle auto-rotation; pointer drag spins with inertia. Depth-cued
     alpha/size; hubs in Paper, spokes in Blueprint 300; square node dots
     (0-radius idiom). Reduced motion: one static render, drag still works. */
  (function () {
    var cv = document.getElementById('graph-canvas');
    if (!cv) return;
    var g = cv.getContext('2d');
    if (!g) return;

    var HUBS = ['Small business', 'Technology', 'Improvement'];
    /* spoke → category: t = Technology, i = Improvement, g = relationship/outcome
       (gold, hangs off Small business). 61 spokes + 3 hubs = 64 words. */
    var SPOKES = [
      ['Process', 'i'], ['Workflow', 'i'], ['Efficiency', 'i'], ['Documentation', 'i'],
      ['Standards', 'i'], ['Planning', 'i'], ['Scheduling', 'i'], ['Reporting', 'i'],
      ['Dashboards', 'i'], ['Procurement', 'i'], ['Vendors', 'i'], ['Renewals', 'i'],
      ['Onboarding', 'i'], ['Training', 'i'], ['Knowledge', 'i'], ['Continuity', 'i'],
      ['Devices', 't'], ['Workstations', 't'], ['Servers', 't'], ['Networks', 't'],
      ['Wi-Fi', 't'], ['VPN', 't'], ['Remote access', 't'], ['Cloud', 't'],
      ['Email', 't'], ['Calendars', 't'], ['Files', 't'], ['Storage', 't'],
      ['Permissions', 't'], ['Identity', 't'], ['MFA', 't'], ['Encryption', 't'],
      ['Patching', 't'], ['Monitoring', 't'], ['Backups', 't'], ['Recovery', 't'],
      ['Uptime', 't'], ['Microsoft 365', 't'], ['Teams', 't'], ['SharePoint', 't'],
      ['OneDrive', 't'],
      ['Automation', 'i'], ['Scripting', 'i'], ['Integrations', 'i'],
      ['Custom software', 'i'], ['Prototyping', 'i'], ['Migration', 'i'], ['Data', 'i'],
      ['Procedures', 'i'], ['Checklists', 'i'], ['Budgeting', 'i'], ['Inventory', 'i'],
      ['Contracts', 'i'], ['Simplicity', 'i'],
      ['Firewall', 't'], ['Passwords', 't'], ['Updates', 't'], ['Sync', 't'],
      ['Sharing', 't'], ['Accounts', 't'],
      ['Hardware', 't'], ['Software', 't'], ['Licensing', 't'], ['Warranties', 't'],
      ['Printers', 't'], ['Scanning', 't'], ['Phones', 't'], ['Mobile', 't'],
      ['Deployment', 't'], ['Refresh', 't'],
      ['Outlook', 't'], ['Excel', 't'], ['Entra', 't'], ['Intune', 't'],
      ['Applications', 'i'], ['Databases', 'i'], ['Modernization', 'i'], ['Forms', 'i'],
      ['Templates', 'i'], ['Paperless', 'i'],
      ['People', 'g'], ['Partnership', 'g'], ['Listening', 'g'], ['Stewardship', 'g'],
      ['Support', 'g'], ['Trust', 'g'], ['Time', 'g'], ['Focus', 'g'],
      ['Clarity', 'g'], ['Reliability', 'g'], ['Resilience', 'g'], ['Gratitude', 'g'],
      ['Refinement', 'g']
    ];
    /* disperse the gold relationship/outcome words evenly through the slot
       order so they spread across the whole sphere instead of clumping */
    (function () {
      var goldW = SPOKES.filter(function (s) { return s[1] === 'g'; });
      var restW = SPOKES.filter(function (s) { return s[1] !== 'g'; });
      var out = [], gap = Math.floor(restW.length / goldW.length), gi = 0;
      restW.forEach(function (s, i) {
        out.push(s);
        if ((i + 1) % gap === 0 && gi < goldW.length) out.push(goldW[gi++]);
      });
      while (gi < goldW.length) out.push(goldW[gi++]);
      SPOKES = out;
    })();
    var WORDS = HUBS.concat(SPOKES.map(function (s) { return s[0]; }));
    var CAT = ['hub', 'hub', 'hub'].concat(SPOKES.map(function (s) { return s[1]; }));
    var HUB_OF = { t: 1, i: 2, g: 0 };
    function wi(name) { return WORDS.indexOf(name); }
    var EDGES = [[0, 1], [0, 2], [1, 2]];
    SPOKES.forEach(function (s) { EDGES.push([wi(s[0]), HUB_OF[s[1]]]); });
    [['Process', 'Workflow'], ['Automation', 'Custom software'], ['Backups', 'Recovery'],
     ['Identity', 'MFA'], ['Microsoft 365', 'Teams'], ['Documentation', 'Training'],
     ['Listening', 'Trust'], ['Efficiency', 'Time'], ['Scripting', 'Integrations'],
     ['Monitoring', 'Uptime']].forEach(function (pr) { EDGES.push([wi(pr[0]), wi(pr[1])]); });

    var W, H, R, CX, CY, DPR;
    function size() {
      DPR = window.devicePixelRatio || 1;
      W = cv.offsetWidth; H = cv.offsetHeight;
      cv.width = W * DPR; cv.height = H * DPR;
      g.setTransform(DPR, 0, 0, DPR, 0, 0);
      R = Math.min(Math.min(W, H) * 0.38, 320);
      CX = W * 0.5; CY = H * 0.5;   /* the graph owns the mission band's right column */
    }
    size();
    window.addEventListener('resize', function () { size(); if (reduceMotion) render(); });

    /* fibonacci sphere — hubs assigned to spread slots (0/21/42) so the three
       anchor words don't cluster at one pole */
    var SLOT = (function () {
      var free = [], p = [], i;
      for (i = 0; i < WORDS.length; i++) free.push(i);
      p[0] = 0; p[1] = 32; p[2] = 64;
      free = free.filter(function (s) { return s !== 0 && s !== 32 && s !== 64; });
      for (i = 3; i < WORDS.length; i++) p[i] = free[i - 3];
      return p;
    })();
    var pts = WORDS.map(function (_, i) {
      var n = WORDS.length, k = SLOT[i];
      var y = 1 - (k / (n - 1)) * 2;
      var rad = Math.sqrt(1 - y * y);
      var th = 2.399963229728653 * k;   /* golden angle */
      return { x: Math.cos(th) * rad, y: y, z: Math.sin(th) * rad,
               vx: 0, vy: 0, vz: 0, pin: i < HUBS.length, birth: 0 };
    });

    /* ===== living growth: new words spawn and the cloud reforms =====
       Each spawns near its hub, flashes in bright, and on-sphere repulsion
       shoves the neighborhood apart to make room. Hubs stay pinned. */
    var GROWTH = [
      ['Security', 't'], ['AI', 't'], ['Process automation', 'i'],
      ['Best practices', 'i'], ['Peace of mind', 'g']
    ];
    /* growth starts only once the graph is actually on screen */
    var growthArmed = false, nextSpawn = 0;
    if ('IntersectionObserver' in window) {
      var gio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting && !growthArmed) {
            growthArmed = true;
            nextSpawn = performance.now() + 2500;
            gio.disconnect();
          }
        });
      }, { threshold: 0.4 });
      gio.observe(cv);
    } else {
      growthArmed = true;
      nextSpawn = performance.now() + 4500;
    }
    function maybeSpawn(now) {
      if (!growthArmed || !GROWTH.length || now < nextSpawn) return;
      var gw = GROWTH.shift();
      var hub = pts[HUB_OF[gw[1]]];
      var x = hub.x + (Math.random() - 0.5) * 1.1;
      var y = hub.y + (Math.random() - 0.5) * 1.1;
      var z = hub.z + (Math.random() - 0.5) * 1.1;
      var m = Math.sqrt(x * x + y * y + z * z) || 1;
      WORDS.push(gw[0]); CAT.push(gw[1]);
      pts.push({ x: x / m, y: y / m, z: z / m, vx: 0, vy: 0, vz: 0, pin: false, birth: now });
      EDGES.push([WORDS.length - 1, HUB_OF[gw[1]]]);
      nextSpawn = now + 6500 + Math.random() * 3000;
    }
    function relax() {
      var n = pts.length, i, j, p;
      for (i = 0; i < n; i++) {
        var a = pts[i];
        for (j = i + 1; j < n; j++) {
          var b = pts[j];
          var dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
          var d2 = dx * dx + dy * dy + dz * dz;
          if (d2 > 0.16 || d2 === 0) continue;   /* only near neighbors */
          var f = 0.00035 / (d2 + 0.01);
          if (!a.pin) { a.vx += dx * f; a.vy += dy * f; a.vz += dz * f; }
          if (!b.pin) { b.vx -= dx * f; b.vy -= dy * f; b.vz -= dz * f; }
        }
      }
      for (i = 0; i < n; i++) {
        p = pts[i];
        if (p.pin) continue;
        p.x += p.vx; p.y += p.vy; p.z += p.vz;
        p.vx *= 0.86; p.vy *= 0.86; p.vz *= 0.86;
        var m = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z) || 1;
        p.x /= m; p.y /= m; p.z /= m;
      }
    }

    var rotY = 0.6, rotX = -0.15, vY = 0, vX = 0, dragging = false, lastX = 0, lastY = 0;
    /* elastic display rotation: an under-damped spring chases the target, so a
       grab stretches and a release wobbles before settling */
    var dispY = rotY, dispX = rotX, svY = 0, svX = 0;
    var F = 2.4;   /* perspective strength (in units of R) */

    function project(p) {
      var cy = Math.cos(dispY), sy = Math.sin(dispY);
      var cx = Math.cos(dispX), sx = Math.sin(dispX);
      var x = p.x * cy + p.z * sy;
      var z1 = -p.x * sy + p.z * cy;
      var y = p.y * cx - z1 * sx;
      var z = p.y * sx + z1 * cx;
      var s = F / (F + z);   /* z in [-1,1]; nearer (z<0) => s>1 */
      return { x: CX + x * R * s, y: CY + y * R * s, s: s, z: z };
    }

    function render(now) {
      now = now || 0;
      g.clearRect(0, 0, W, H);
      var proj = pts.map(project);
      /* edges first */
      for (var e = 0; e < EDGES.length; e++) {
        var a = proj[EDGES[e][0]], b = proj[EDGES[e][1]];
        var da = ((a.s + b.s) / 2 - 0.75) / 0.7;   /* depth mix 0..1 */
        var al = 0.04 + Math.max(0, Math.min(1, da)) * 0.14;
        g.strokeStyle = 'rgba(58,111,160,' + al.toFixed(3) + ')';
        g.lineWidth = 1;
        g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke();
      }
      /* nodes far-to-near */
      var order = proj.map(function (p, i) { return i; })
        .sort(function (i, j) { return proj[j].z - proj[i].z; });
      for (var k = 0; k < order.length; k++) {
        var i = order[k], p = proj[i];
        var hub = i < HUBS.length;
        var gold = CAT[i] === 'g';
        var depth = Math.max(0, Math.min(1, (p.s - 0.72) / 0.75));
        var al2 = (hub ? 0.35 : 0.22) + depth * (hub ? 0.6 : 0.5);
        var col = hub ? '232,238,246' : (gold ? '225,169,86' : '159,185,212');
        var fs = (hub ? 12.5 : 9.5) * p.s;
        /* newborn words materialize: oversized, typing on with a sparking
           cursor, then shrink and take their color to join the others */
        var pt3 = pts[i];
        var txt = WORDS[i];
        var typing = false;
        if (pt3.birth) {
          var t3 = now - pt3.birth;
          if (t3 < 1800) {
            typing = true;
            var prog = t3 / 1800;
            txt = txt.slice(0, Math.max(1, Math.ceil(prog * txt.length)));
            fs = 22 * p.s;
            al2 = 0.95;
            col = '232,238,246';
          } else {
            var j2 = Math.min(1, (t3 - 1800) / 900);
            var j2e = 1 - Math.pow(1 - j2, 3);
            fs = (22 - (22 - 9.5) * j2e) * p.s;
            al2 = 0.95 - (0.95 - al2) * j2e;
            if (j2 < 1) col = '232,238,246';
            else pt3.birth = 0;
          }
        }
        var dot = 2.5 * p.s;
        g.fillStyle = 'rgba(' + col + ',' + al2.toFixed(3) + ')';
        g.fillRect(p.x - dot / 2, p.y - dot / 2, dot, dot);
        if (al2 < 0.34 && !hub) continue;   /* far-back spokes: dot only, no label (96 words = keep it airy) */
        g.font = (hub ? '500 ' : '400 ') + fs.toFixed(1) + 'px "IBM Plex Mono", monospace';
        g.textBaseline = 'middle';
        /* flip the label to the left of the dot when it would clip the right edge */
        var tw = g.measureText(txt).width;
        var tx = p.x + dot / 2 + 5;
        if (!typing && tx + tw > W - 12) {
          g.textAlign = 'right';
          g.fillText(txt, p.x - dot / 2 - 5, p.y);
          g.textAlign = 'left';
        } else {
          g.fillText(txt, tx, p.y);
          if (typing) {
            /* sparking block cursor: fast flicker + a stray spark tick */
            var ca = 0.35 + 0.65 * Math.abs(Math.sin(now * 0.045));
            g.fillStyle = 'rgba(232,238,246,' + ca.toFixed(2) + ')';
            g.fillRect(tx + tw + 3, p.y - fs * 0.45, fs * 0.5, fs * 0.9);
            if (Math.sin(now * 0.09 + i) > 0.55) {
              g.fillRect(tx + tw + 3 + fs * 0.6, p.y - fs * (0.6 + 0.3 * Math.abs(Math.sin(now * 0.03 + i))), 1.5, 1.5);
            }
          }
        }
      }
    }

    cv.addEventListener('pointerdown', function (e) {
      dragging = true; lastX = e.clientX; lastY = e.clientY;
      vY = 0; vX = 0;
      cv.classList.add('dragging');
      cv.setPointerCapture && cv.setPointerCapture(e.pointerId);
    });
    cv.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var dx = e.clientX - lastX, dy = e.clientY - lastY;
      lastX = e.clientX; lastY = e.clientY;
      vY = dx * 0.005; vX = dy * 0.003;
      rotY += vY;
      rotX = Math.max(-0.7, Math.min(0.7, rotX + vX));
      if (reduceMotion) { dispY = rotY; dispX = rotX; render(performance.now()); }
    });
    function endDrag() { dragging = false; cv.classList.remove('dragging'); }
    cv.addEventListener('pointerup', endDrag);
    cv.addEventListener('pointercancel', endDrag);

    if (reduceMotion) {
      dispY = rotY; dispX = rotX;
      render(performance.now());   /* static; re-renders on drag only */
    } else {
      (function loop(now) {
        if (!dragging) {
          /* inertia decays into the idle auto-spin */
          vY *= 0.95; vX *= 0.95;
          rotY += 0.0008 + vY;   /* slow idle spin */
          rotX = Math.max(-0.7, Math.min(0.7, rotX + vX));
        }
        /* under-damped spring — the elastic grab/wobble */
        svY += (rotY - dispY) * 0.09; svY *= 0.88; dispY += svY;
        svX += (rotX - dispX) * 0.09; svX *= 0.88; dispX += svX;
        maybeSpawn(now);
        relax();
        render(now);
        requestAnimationFrame(loop);
      })(performance.now());
    }
  })();

  /* ===== 03 · Values — the foundation =====
     Eight value blocks laid as an irregular masonry wall. On first scroll the
     blocks lower into place; a highlight then moves block to block with the
     glyph + blurb swapping below. Click any block to select it.
     Reduced motion: wall static, clicks swap instantly. */
  (function () {
    var wallEl = document.getElementById('f-wall');
    if (!wallEl) return;
    var VALUES = [
      ['Humility', 'We don\u2019t have all the answers. We ask, listen, and learn your business before we touch anything.',
        '<path d="M4 5h16v11h-8.5L8 19.5V16H4z"/><circle cx="8.5" cy="10.5" r="0.8"/><circle cx="12" cy="10.5" r="0.8"/><circle cx="15.5" cy="10.5" r="0.8"/>'],
      ['Responsibility', 'Your systems are our watch. When something breaks, we own it to done.',
        '<path d="M12 3l7 3v5c0 4.4-2.8 7.4-7 10-4.2-2.6-7-5.6-7-10V6z"/><path d="M9 11.5l2 2 4-4"/>'],
      ['Gratitude', 'Grateful by default \u2014 for the work, the trust, and the people who let us serve them.',
        '<path d="M12 20S4.5 15.6 3 11c-1-3 1-6 4-6 2 0 3.8 1.2 5 3 1.2-1.8 3-3 5-3 3 0 5 3 4 6-1.5 4.6-9 9-9 9z"/>'],
      ['Transparency', 'You see what we see: honest recommendations, plain language, no black boxes.',
        '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z"/><circle cx="12" cy="12" r="2.5"/>'],
      ['Integrity', 'The right solution, not \u201ca\u201d solution \u2014 even when it\u2019s less work for us.',
        '<path d="M12 5v15M9 20h6M4 7h16"/><path d="M4 7l-2 4.5h4z"/><path d="M20 7l-2 4.5h4z"/>'],
      ['Stewardship', 'Your money and time, spent like our own. The smallest stack that does the job.',
        '<path d="M12 20v-7"/><path d="M12 13C12 9.5 9.5 7 6 7c0 3.5 2.5 6 6 6z"/><path d="M12 13c0-3.5 2.5-6 6-6 0 3.5-2.5 6-6 6z"/>'],
      ['Perseverance', 'Problems don\u2019t get dropped. We stay with the hard ones until they stay solved.',
        '<path d="M3 19l6-10 4 6 3-4 5 8z"/><path d="M2 19h20"/>'],
      ['Respect', 'For your people, your time, and how you work \u2014 technology adapts to you, not the other way around.',
        '<circle cx="8" cy="8.5" r="2.5"/><path d="M3.5 18.5c.5-2.8 2.2-4.2 4.5-4.2s4 1.4 4.5 4.2"/><circle cx="16" cy="8.5" r="2.5"/><path d="M11.5 18.5c.5-2.8 2.2-4.2 4.5-4.2s4 1.4 4.5 4.2"/>']
    ];
    var detailEl = document.getElementById('f-detail');
    var nameEl = document.getElementById('f-name');
    var blurbEl = document.getElementById('f-blurb');
    var counterEl = document.getElementById('f-counter');
    var glyphEl = document.getElementById('v-glyph-g');
    var band = document.querySelector('.values');

    var blocks = [];
    [[0, 4, 'c1'], [4, 8, 'c2']].forEach(function (course) {
      var row = document.createElement('div');
      row.className = 'f-course ' + course[2];
      for (var i = course[0]; i < course[1]; i++) (function (i) {
        var b = document.createElement('button');
        b.className = 'f-block' + (i === 0 ? ' active' : '');
        b.textContent = VALUES[i][0];
        b.addEventListener('click', function () { go(i, true); });
        row.appendChild(b);
        blocks.push(b);
      })(i);
      wallEl.appendChild(row);
    });

    var idx = 0, timer = null, swapping = false;
    function paint() {
      nameEl.textContent = VALUES[idx][0];
      blurbEl.textContent = VALUES[idx][1];
      /* safe: VALUES glyphs are static literals above — never feed from user/remote data */
      if (glyphEl) glyphEl.innerHTML = VALUES[idx][2];
      counterEl.textContent = ('0' + (idx + 1)).slice(-2) + ' / 0' + VALUES.length;
      blocks.forEach(function (b, i) { b.classList.toggle('active', i === idx); });
    }
    function go(i, user) {
      if (swapping || i === idx) return;
      idx = (i + VALUES.length) % VALUES.length;
      if (reduceMotion) { paint(); return; }
      swapping = true;
      detailEl.classList.add('swapping');
      setTimeout(function () {
        paint();
        detailEl.classList.remove('swapping');
        swapping = false;
      }, 270);
      if (user) restart();
    }
    function restart() {
      if (reduceMotion) return;
      clearInterval(timer);
      timer = setInterval(function () { go(idx + 1); }, 4200);
    }
    var foundation = document.getElementById('values-foundation');
    foundation.addEventListener('mouseenter', function () { clearInterval(timer); });
    foundation.addEventListener('mouseleave', restart);
    paint();
    restart();

    /* blocks lower into place on first approach (visible-by-default arming) */
    if (band && !reduceMotion && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { band.classList.add('in-view'); io.disconnect(); }
        });
      }, { threshold: 0.25 });
      window.addEventListener('scroll', function () {
        band.classList.add('armed');
        io.observe(band);
        setTimeout(function () { band.classList.add('in-view'); io.disconnect(); }, 4000);
      }, { once: true, passive: true });
    }
  })();

  /* ===== Pillars scroll reveal =====
     Content is visible by default. The hidden state arms on the user's FIRST
     scroll (so the effect actually plays no matter how long they linger on the
     hero), the observer reveals it in view, and a post-arm fallback guarantees
     nothing stays hidden. Unscrolled renders (screenshots, no-JS) show content. */
  (function () {
    var el = document.querySelector('.pillars');
    if (!el) return;
    if (reduceMotion || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { el.classList.add('in-view'); io.disconnect(); }
      });
    }, { threshold: 0.3 });
    window.addEventListener('scroll', function () {
      el.classList.add('armed');
      io.observe(el);
      setTimeout(function () { el.classList.add('in-view'); io.disconnect(); }, 4000);
    }, { once: true, passive: true });
  })();

  /* ===== How we work — the improvement loop =====
     A drafting-style ring with six stations; an ochre signal spark travels the
     circuit. When it reaches a station, the station lights and the facet text
     swaps into the ring's center. Click a station to send the spark there.
     Reduced motion: static diagram, clicks swap instantly. */
  (function () {
    var wrap = document.querySelector('.cycle-wrap');
    var cv = document.getElementById('cycle-canvas');
    if (!wrap || !cv) return;
    var g = cv.getContext('2d');
    if (!g) return;

    var FACETS = [
      ['A fresh perspective', 'Without a fresh perspective, it\u2019s hard to identify a better way. Our ideal partner is tired of \u201cthat\u2019s the way we\u2019ve always done it.\u201d'],
      ['The right technology', 'The \u201clatest\u201d technology is not always the \u201cright\u201d technology. We transform systems and processes over time instead of instituting generic quick-fixes.'],
      ['Continual research', 'We identify, research, and use the best tools and automations for the dollar \u2014 which regularly yields new ways to reduce expenses and increase revenue.'],
      ['Support that clears the path', 'Background services are automated so support hours go to what matters most: finding bottlenecks and reducing interruptions to your staff.'],
      ['Documentation', 'Uniform, united, uncomplicated. Good documentation enables transparency, promotes accountability, and frees \u201cbrain-locked\u201d information.'],
      ['Education', 'We meet people where they are, listen to their ideas, and teach broader principles in small, manageable portions \u2014 so ideas flourish.']
    ];
    var N = FACETS.length;
    var TAU = Math.PI * 2;
    function ang(i) { return -TAU / 4 + (i / N) * TAU; }

    var stationsEl = document.getElementById('cycle-stations');
    var centerEl = document.getElementById('cycle-center');
    var titleEl = document.getElementById('cyc-title');
    var bodyEl = document.getElementById('cyc-body');
    var counterEl = document.getElementById('cyc-counter');
    var LABELS = ['Perspective', 'Right technology', 'Research', 'Support', 'Documentation', 'Education'];
    var stations = [];
    FACETS.forEach(function (f, i) {
      var b = document.createElement('button');
      b.className = 'cyc-station' + (i === 0 ? ' active' : '');
      var mk = document.createElement('span'); mk.className = 'mk';
      var tx = document.createElement('span'); tx.textContent = LABELS[i];
      b.appendChild(mk); b.appendChild(tx);
      b.setAttribute('aria-label', f[0]);
      b.addEventListener('click', function () { send(i); });
      stationsEl.appendChild(b);
      stations.push(b);
    });

    var W, H, CX, CY, R;
    function size() {
      W = cv.width = cv.offsetWidth;
      H = cv.height = cv.offsetHeight;
      CX = W / 2; CY = H / 2;
      R = Math.min(W, H) * 0.42;
      stations.forEach(function (b, i) {
        var lr = R + Math.min(34, W * 0.06);
        b.style.left = (CX + Math.cos(ang(i)) * lr) / W * 100 + '%';
        b.style.top = (CY + Math.sin(ang(i)) * lr) / H * 100 + '%';
      });
      if (reduceMotion) render();
    }

    var active = 0, theta = ang(0), target = ang(0);
    var moving = false, dwellUntil = 0, swapping = false;

    function paint(i) {
      counterEl.textContent = '0' + (i + 1) + ' / 0' + N;
      titleEl.textContent = FACETS[i][0];
      bodyEl.textContent = FACETS[i][1];
      stations.forEach(function (b, k) { b.classList.toggle('active', k === i); });
    }
    function swapTo(i) {
      if (swapping) return;
      swapping = true;
      centerEl.classList.add('swapping');
      setTimeout(function () {
        paint(i);
        centerEl.classList.remove('swapping');
        swapping = false;
      }, 270);
    }
    function fwd(from, to) { var d = to - from; while (d <= 0) d += TAU; return d; }
    function send(i) {
      if (i === active && !moving) return;
      active = i;
      target = ang(i);
      moving = true;
      if (reduceMotion) { theta = target; moving = false; swapTo(i); render(); }
    }

    function render() {
      g.clearRect(0, 0, W, H);
      g.strokeStyle = 'rgba(58,111,160,0.5)';
      g.lineWidth = 1;
      g.beginPath(); g.arc(CX, CY, R, 0, TAU); g.stroke();
      g.strokeStyle = 'rgba(58,111,160,0.35)';
      for (var i = 0; i < N; i++) {
        var a = ang(i);
        g.beginPath();
        g.moveTo(CX + Math.cos(a) * (R - 6), CY + Math.sin(a) * (R - 6));
        g.lineTo(CX + Math.cos(a) * (R + 6), CY + Math.sin(a) * (R + 6));
        g.stroke();
      }
      if (reduceMotion) return;
      var TAIL = 0.55;
      for (var t = 0; t < 22; t++) {
        var a0 = theta - TAIL * (1 - t / 22);
        var a1 = theta - TAIL * (1 - (t + 1) / 22);
        g.strokeStyle = 'rgba(225,169,86,' + (0.55 * t / 22).toFixed(3) + ')';
        g.lineWidth = 1.6;
        g.beginPath(); g.arc(CX, CY, R, a0, a1); g.stroke();
      }
      var hx = CX + Math.cos(theta) * R, hy = CY + Math.sin(theta) * R;
      g.fillStyle = 'rgba(225,169,86,0.95)';
      g.fillRect(hx - 2.5, hy - 2.5, 5, 5);
    }

    size();
    window.addEventListener('resize', size);
    paint(0);

    if (reduceMotion) {
      render();
    } else {
      (function loop(now) {
        if (moving) {
          var d = fwd(theta, target);
          var step = 0.014 + d * 0.02;
          if (d <= step) {
            theta = target;
            moving = false;
            dwellUntil = now + 4600;
            swapTo(active);
          } else {
            theta += step;
          }
        } else if (now >= dwellUntil) {
          active = (active + 1) % N;
          target = ang(active);
          moving = true;
        }
        render();
        requestAnimationFrame(loop);
      })(performance.now());
    }
  })();

  /* ===== Scroll-recede fallback =====
     Chrome drives .hero-content via CSS animation-timeline: scroll(root).
     Browsers without scroll-driven animations (Safari/Firefox) get a JS fade +
     scale from document scroll. Skipped entirely under reduced motion. */
  if (!reduceMotion && !(CSS && CSS.supports && CSS.supports('animation-timeline: scroll()'))) {
    var hc = document.querySelector('.hero-content');
    if (hc) {
      hc.style.animation = 'none';
      window.addEventListener('scroll', function () {
        var t = Math.min(1, window.scrollY / window.innerHeight);
        hc.style.opacity = String(1 - 0.75 * t);
        hc.style.transform = 'scale(' + (1 - 0.04 * t) + ')';
      }, { passive: true });
    }
  }
})();
