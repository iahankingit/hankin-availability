(async function () {
  const API_URL = 'https://script.google.com/macros/s/AKfycbwn7bVRM4jUomhbbJfWnf09ElW2gzbK8p_cVTFh5WAlzFtQOp2J-OVf3N6KoH4A68TZNg/exec';

  // ---- Load Almarai from Google Fonts (once) ----
  if (!document.getElementById('availability-font')) {
    const preconnect1 = document.createElement('link');
    preconnect1.rel = 'preconnect';
    preconnect1.href = 'https://fonts.googleapis.com';
    document.head.appendChild(preconnect1);

    const preconnect2 = document.createElement('link');
    preconnect2.rel = 'preconnect';
    preconnect2.href = 'https://fonts.gstatic.com';
    preconnect2.crossOrigin = 'anonymous';
    document.head.appendChild(preconnect2);

    const font = document.createElement('link');
    font.id = 'availability-font';
    font.rel = 'stylesheet';
    font.href = 'https://fonts.googleapis.com/css2?family=Almarai:wght@300;400;700;800&display=swap';
    document.head.appendChild(font);
  }

  // ---- Inject styles (once) ----
  if (!document.getElementById('availability-styles')) {
    const style = document.createElement('style');
    style.id = 'availability-styles';
    style.textContent = `
      #availability {
        font-family: 'Almarai', sans-serif;
        width: 100%;
        box-sizing: border-box;
        margin: 1.5rem 0;
        container-type: inline-size;
      }
      #availability * { box-sizing: border-box; font-family: 'Almarai', sans-serif; }
      #availability .summary {
        font-size: clamp(0.95rem, 2.5cqw, 1.1rem);
        margin-bottom: 1rem;
        color: #333;
      }
      #availability table {
        width: 100%;
        border-collapse: collapse;
        background: #fff;
      }
      #availability th, #availability td {
        text-align: left;
        padding: 0.85rem 1rem;
        border-bottom: 1px solid #eee;
      }
      #availability th {
        background: #f7f7f7;
        font-weight: 700;
        font-size: 0.8rem;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: #555;
      }
      #availability th.sortable { cursor: pointer; user-select: none; white-space: nowrap; }
      #availability th.sortable:hover { color: #1f4f8f; }
      #availability th .arrow { display: inline-block; width: 0.9em; opacity: 0.4; }
      #availability th.active .arrow { opacity: 1; }
      #availability td.area { font-variant-numeric: tabular-nums; white-space: nowrap; }
      #availability .status {
        display: inline-block;
        padding: 0.2rem 0.7rem;
        border-radius: 999px;
        font-size: 0.8rem;
        font-weight: 700;
        background: #e3f5e1;
        color: #1f6f1f;
      }
      #availability .floorplan {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        color: #1f4f8f;
        text-decoration: none;
        font-weight: 700;
        font-size: 0.9rem;
      }
      #availability .floorplan:hover { text-decoration: underline; }
      #availability .floorplan svg { width: 16px; height: 16px; }
      #availability .sort-mobile { display: none; margin-bottom: 1rem; }
      #availability .sort-mobile label {
        font-size: 0.8rem;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: #888;
        margin-right: 0.5rem;
      }
      #availability .sort-mobile select {
        font-family: 'Almarai', sans-serif;
        font-size: 0.9rem;
        padding: 0.4rem 0.6rem;
        border: 1px solid #ddd;
        border-radius: 6px;
        background: #fff;
      }
      #availability .empty {
        padding: 2rem;
        background: #f7f7f7;
        border-radius: 8px;
        text-align: center;
        color: #555;
      }

      /* Restack into cards when the container itself is narrow */
      @container (max-width: 540px) {
        #availability thead { display: none; }
        #availability table, #availability tbody { display: block; }
        #availability tr {
          display: block;
          border: 1px solid #eee;
          border-radius: 8px;
          margin-bottom: 0.75rem;
          padding: 0.5rem 0.75rem;
        }
        #availability td {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0;
          border: none;
        }
        #availability td::before {
          content: attr(data-label);
          font-weight: 700;
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: #888;
        }
        #availability .sort-mobile { display: block; }
      }
    `;
    document.head.appendChild(style);
  }

  // ---- Ensure a container exists ----
  let container = document.getElementById('availability');
  if (!container) {
    container = document.createElement('div');
    container.id = 'availability';
    container.textContent = 'Loading availability…';
    if (document.currentScript) {
      document.currentScript.parentNode.insertBefore(container, document.currentScript);
    } else {
      document.body.appendChild(container);
    }
  }

  // ---- Helpers ----
  const slug = window.location.pathname.split('/').filter(Boolean).pop();

  const parseNum = v => {
    if (v === null || v === undefined || v === '') return null;
    const n = Number(String(v).replace(/,/g, ''));
    return isNaN(n) ? null : n;
  };

  const formatSuite = unit => {
    const parts = String(unit).trim().split('_');
    return parts.length > 1 ? `Suite ${parts.slice(1).join('_')}` : String(unit).trim();
  };

  const fmt = n => n == null ? '—' : n.toLocaleString(undefined, { maximumFractionDigits: 0 });

  const normalizeUrl = url => {
    if (!url) return '';
    const m = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (m) return `https://drive.google.com/file/d/${m[1]}/view`;
    return url;
  };

  const downloadIcon = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>`;

  // ---- Fetch & render ----
  try {
    const res = await fetch(`${API_URL}?slug=${encodeURIComponent(slug)}`);
    const data = await res.json();

    const rows = (data.suites || []).map(r => ({
      unit: r.unit,
      area: parseNum(r.area),
      floorPlan: normalizeUrl(r.floorPlan)
    }));

    if (rows.length === 0) {
      container.innerHTML = `<div class="empty">No suites are currently available at this property. Please contact us about upcoming availability.</div>`;
      return;
    }

    const totalArea = rows.reduce((sum, r) => sum + (r.area || 0), 0);

    // Natural sort for suite names so "Suite 9" < "Suite 107"
    const suiteKey = r => formatSuite(r.unit).toLowerCase();
    const compare = {
      unit: (a, b) => suiteKey(a).localeCompare(suiteKey(b), undefined, { numeric: true }),
      area: (a, b) => (a.area || 0) - (b.area || 0)
    };

    let sortBy = 'area';   // default column
    let sortDir = -1;      // -1 = desc (largest first), 1 = asc

    const arrow = col => sortBy === col ? (sortDir === 1 ? '▲' : '▼') : '';

    const render = () => {
      const sorted = rows.slice().sort((a, b) => compare[sortBy](a, b) * sortDir);

      container.innerHTML = `
        <div class="summary">
          <strong>${rows.length}</strong> ${rows.length === 1 ? 'suite' : 'suites'} available
          ${totalArea > 0 ? `· <strong>${fmt(totalArea)}</strong> total sq ft` : ''}
        </div>

        <div class="sort-mobile">
          <label for="availability-sort">Sort by</label>
          <select id="availability-sort">
            <option value="area-desc"${sortBy === 'area' && sortDir === -1 ? ' selected' : ''}>Area (largest first)</option>
            <option value="area-asc"${sortBy === 'area' && sortDir === 1 ? ' selected' : ''}>Area (smallest first)</option>
            <option value="unit-asc"${sortBy === 'unit' && sortDir === 1 ? ' selected' : ''}>Suite (A–Z)</option>
            <option value="unit-desc"${sortBy === 'unit' && sortDir === -1 ? ' selected' : ''}>Suite (Z–A)</option>
          </select>
        </div>

        <table>
          <thead>
            <tr>
              <th class="sortable ${sortBy === 'unit' ? 'active' : ''}" data-sort="unit">
                Suite <span class="arrow">${arrow('unit')}</span>
              </th>
              <th class="sortable ${sortBy === 'area' ? 'active' : ''}" data-sort="area">
                Area (sq ft) <span class="arrow">${arrow('area')}</span>
              </th>
              <th>Status</th>
              <th>Floor Plan</th>
            </tr>
          </thead>
          <tbody>
            ${sorted.map(r => `
              <tr>
                <td data-label="Suite">${formatSuite(r.unit)}</td>
                <td class="area" data-label="Area (sq ft)">${fmt(r.area)}</td>
                <td data-label="Status"><span class="status">Available</span></td>
                <td data-label="Floor Plan">${r.floorPlan
                  ? `<a class="floorplan" href="${r.floorPlan}" target="_blank" rel="noopener">${downloadIcon}<span>View</span></a>`
                  : '—'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;

      // Desktop: clickable headers
      container.querySelectorAll('th.sortable').forEach(th => {
        th.addEventListener('click', () => {
          const col = th.dataset.sort;
          if (sortBy === col) {
            sortDir *= -1;
          } else {
            sortBy = col;
            sortDir = col === 'area' ? -1 : 1;
          }
          render();
        });
      });

      // Mobile: dropdown
      const select = container.querySelector('#availability-sort');
      if (select) {
        select.addEventListener('change', () => {
          const [col, dir] = select.value.split('-');
          sortBy = col;
          sortDir = dir === 'asc' ? 1 : -1;
          render();
        });
      }
    };

    render();
  } catch (err) {
    container.innerHTML = `<div class="empty">Could not load availability. Please try again later.</div>`;
    console.error('Availability load error:', err);
  }
})();
