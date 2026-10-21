"use strict";
(() => {
  // Chạy chung trên cả 5 trang; chỉ kích hoạt tính năng khi có đúng phần tử liên quan.
  const $ = selector => document.querySelector(selector);
  const $$ = selector => Array.from(document.querySelectorAll(selector));
  const menu = $('#menu-toggle');
  const nav = $('#site-nav');
  if (menu && nav) {
    menu.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      menu.setAttribute('aria-expanded', String(open));
      menu.setAttribute('aria-label', open ? 'Đóng menu' : 'Mở menu');
    });
    nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
      nav.classList.remove('open');
      menu.setAttribute('aria-expanded', 'false');
    }));
  }
  const year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());

  let lastFocus = null;
  function openModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    lastFocus = document.activeElement;
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    const first = modal.querySelector('input, button');
    if (first) first.focus();
  }
  function closeModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.remove('open');
    if (!$('.modal-backdrop.open')) document.body.style.overflow = '';
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
  }
  $$('[data-close]').forEach(button => button.addEventListener('click', () => closeModal(button.dataset.close)));
  $$('.modal-backdrop').forEach(modal => modal.addEventListener('mousedown', event => {
    if (event.target === modal) closeModal(modal.id);
  }));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      const open = $('.modal-backdrop.open');
      if (open) closeModal(open.id);
      else if (nav) { nav.classList.remove('open'); if (menu) menu.setAttribute('aria-expanded', 'false'); }
    }
    if (event.key === 'Tab') {
      const modal = $('.modal-backdrop.open');
      if (!modal) return;
      const controls = Array.from(modal.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])'));
      if (!controls.length) return;
      if (event.shiftKey && document.activeElement === controls[0]) {event.preventDefault(); controls[controls.length - 1].focus();}
      else if (!event.shiftKey && document.activeElement === controls[controls.length - 1]) {event.preventDefault(); controls[0].focus();}
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      const search = $('#resource-search');
      if (search) {event.preventDefault(); search.focus(); search.scrollIntoView({behavior:'smooth',block:'center'});}
    }
  });

  const esc = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const icon = (id, klass = 'icon') => `<svg class="${klass}" aria-hidden="true"><use href="#i-${id}"/></svg>`;
  const safeUrl = value => {
    try {const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) ? url.href : null;}
    catch {return null;}
  };
  let toastTimer;
  function toast(message) {
    const element = $('#toast');
    if (!element) return;
    element.textContent = message;
    element.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => element.classList.remove('show'), 2800);
  }

  const projectData = {
    lora: {title:'Hệ thống truyền dữ liệu LoRa',content:'Ý tưởng phát triển hệ thống một hoặc nhiều node cảm biến và một gateway, sử dụng LoRa để truyền dữ liệu không dây. Có thể đánh giá RSSI, SNR và tỷ lệ nhận gói tin.',tags:['STM32','ESP32','LoRa','RSSI','SNR']},
    riscv: {title:'Thiết kế CPU RISC-V RV32IM',content:'Thiết kế CPU 32-bit theo kiến trúc RISC-V với datapath, pipeline, các khối xử lý và testbench kiểm thử RTL.',tags:['RV32IM','SystemVerilog','Pipeline','Vivado']},
    safety: {title:'Thiết bị giám sát an toàn',content:'Thiết bị thu thập dữ liệu cảm biến, xử lý sự kiện và truyền dữ liệu về trạm nhận. Phần này có thể bổ sung ảnh phần cứng, sơ đồ và kết quả đo thực tế sau này.',tags:['FreeRTOS','STM32','GPS','Sensors']}
  };
  $$('.project-detail-button').forEach(button => button.addEventListener('click', () => {
    const detail = projectData[button.dataset.project];
    if (!detail) return;
    $('#project-modal-title').textContent = detail.title;
    $('#project-modal-body').innerHTML = `<p>${esc(detail.content)}</p><b style="font-size:11px;color:#2b6655">Công nghệ / chủ đề:</b><div class="tags">${detail.tags.map(tag => `<span>${esc(tag)}</span>`).join('')}</div><p style="font-size:11px;color:#91a096">Mô tả trên chỉ là nội dung minh họa, chưa phải báo cáo kết quả đo.</p>`;
    openModal('project-modal');
  }));

  const grid = $('#resource-grid');
  if (!grid) return;
  const STORAGE_KEY = 'nguyen-huu-nhon-resource-library-v2';
  const OLD_STORAGE_KEY = 'ben-nho-resource-library-v1';
  const subjectNames = [
    'Môn đại cương',
    'Môn cơ sở ngành',
    'Môn chuyên ngành',
    'Môn tự chọn chuyên ngành',
    'Tiếng Anh giao tiếp 1',
    'Tiếng Anh giao tiếp 2'
  ];
  // Sáu tài liệu công khai: có sẵn trong mã nguồn, mọi khách truy cập GitHub Pages đều xem được.
  const generalSubjects = [
    {id:'shared-general-01',name:'Hóa đại cương',url:'https://drive.google.com/drive/folders/1jvzKuxoSAizkFhqaLMzSJf6TSUHHXK8W?usp=sharing',category:'Môn đại cương',theme:1,shared:true},
    {id:'shared-general-02',name:'Toán 3',url:'https://drive.google.com/drive/folders/1IGlpNkhYy8e35AjXJH3oLp9dMol_xBhh?usp=sharing',category:'Môn đại cương',theme:2,shared:true},
    {id:'shared-general-03',name:'Xác suất thống kê',url:'https://drive.google.com/drive/folders/1Ab5yVd_M7l2sZf8TH2Ng1dBmZ2kZZr-W?usp=sharing',category:'Môn đại cương',theme:3,shared:true},
    {id:'shared-general-04',name:'Ngôn ngữ lập trình C',url:'https://drive.google.com/drive/folders/1gO2-3_ZxV2-wLqjApKNd6lCRwM_1osek?usp=sharing',category:'Môn đại cương',theme:4,shared:true},
    {id:'shared-general-05',name:'Toán 1',url:'https://drive.google.com/file/d/1ffwq5awDBc9vD0l83sOWHzy3_0nYhN9C/view?usp=sharing',category:'Môn đại cương',theme:5,shared:true},
    {id:'shared-general-06',name:'Toán ứng dụng Kỹ sư Điện – Điện tử',url:'https://drive.google.com/file/d/1fUeqaLUhV_SHI4rC0O8e1DZCIoWigDg1/view?usp=sharing',category:'Môn đại cương',theme:6,shared:true}
  ];
  // 12 môn cơ sở ngành: dữ liệu cố định công khai, không phụ thuộc localStorage.
  const foundationSubjects = [
    {id:'shared-foundation-01',name:'Điện tử cơ bản',url:'https://drive.google.com/drive/folders/17P1HhBt2i44vaNZ97ov8Is-O0yFO1xpI?usp=sharing',category:'Môn cơ sở ngành',theme:1,shared:true,sharedType:'foundation'},
    {id:'shared-foundation-02',name:'Điện tử thông tin',url:'https://drive.google.com/drive/folders/1p3VQFJgAnNftzQoEN8_9ZK0bvYjy2UIO?usp=sharing',category:'Môn cơ sở ngành',theme:2,shared:true,sharedType:'foundation'},
    {id:'shared-foundation-03',name:'Đo lường cảm biến',url:'https://drive.google.com/drive/folders/1hfFJw-dPoMBUhYR7gvnlZYBTBVOOOlMm?usp=sharing',category:'Môn cơ sở ngành',theme:3,shared:true,sharedType:'foundation'},
    {id:'shared-foundation-04',name:'Hệ thống viễn thông',url:'https://drive.google.com/drive/folders/1Ui5RFihmti7A3agNXXbKQ4rQ3Yle_nnI?usp=sharing',category:'Môn cơ sở ngành',theme:4,shared:true,sharedType:'foundation'},
    {id:'shared-foundation-05',name:'Kỹ thuật số',url:'https://drive.google.com/drive/folders/1KMLeic2u67qQAWCVejGEG_pBM9i0iL_6?usp=sharing',category:'Môn cơ sở ngành',theme:5,shared:true,sharedType:'foundation'},
    {id:'shared-foundation-06',name:'Kỹ thuật Truyền số liệu',url:'https://drive.google.com/drive/folders/1AuFyX7iOAYiFB-MnQ-gSl4YV39k9pU9C?usp=sharing',category:'Môn cơ sở ngành',theme:6,shared:true,sharedType:'foundation'},
    {id:'shared-foundation-07',name:'Mạch điện',url:'https://drive.google.com/drive/folders/1-wjLHpfLMmra5NI4RQZzYg5ZRUjnqTW6?usp=sharing',category:'Môn cơ sở ngành',theme:7,shared:true,sharedType:'foundation'},
    {id:'shared-foundation-08',name:'Thiết kế Hệ thống và Vi mạch số',url:'https://drive.google.com/drive/folders/1-oaqUAL0pax7lvUZQWiBE1D8arylSToJ?usp=sharing',category:'Môn cơ sở ngành',theme:8,shared:true,sharedType:'foundation'},
    {id:'shared-foundation-09',name:'Tín hiệu và hệ thống',url:'https://drive.google.com/drive/folders/1Q1yLfxHsOq_FZlTVTCQq7d6hYpPHqlqe?usp=sharing',category:'Môn cơ sở ngành',theme:9,shared:true,sharedType:'foundation'},
    {id:'shared-foundation-10',name:'Trường điện từ',url:'https://drive.google.com/drive/folders/1aKi-Tzg41dFkuYdjdOYkmFyfCfhHar-l?usp=sharing',category:'Môn cơ sở ngành',theme:10,shared:true,sharedType:'foundation'},
    {id:'shared-foundation-11',name:'Kỹ thuật Vi xử lý',url:'https://drive.google.com/drive/folders/1I6Rd7TAb5NeDOrTe68_kS_E5gYEghqoh?usp=sharing',category:'Môn cơ sở ngành',theme:11,shared:true,sharedType:'foundation'},
    {id:'shared-foundation-12',name:'Xử lý tín hiệu số',url:'https://drive.google.com/drive/folders/1HvW3RMH_MIThvFO_BkMCBwy7zNIRa47S?usp=sharing',category:'Môn cơ sở ngành',theme:12,shared:true,sharedType:'foundation'}
  ];
  // 7 môn chuyên ngành: link công khai được gắn sẵn trong mã nguồn.
  const specializedSubjects = [
    {"id":"shared-specialized-01","name":"Cơ sở và ứng dụng IoTs","url":"https://drive.google.com/drive/folders/17lGlB7VOq9lGC6VYtI6CshXtAtciaPEA?usp=sharing","category":"Môn chuyên ngành","theme":1,"shared":true,"sharedType":"specialized"},
    {"id":"shared-specialized-02","name":"Hệ thống thông tin vô tuyến","url":"https://drive.google.com/drive/folders/1mXEsfXXXQAMGIYH928YP0FZq1JfG8Vqe?usp=sharing","category":"Môn chuyên ngành","theme":2,"shared":true,"sharedType":"specialized"},
    {"id":"shared-specialized-03","name":"Hệ thống viễn thông","url":"https://drive.google.com/drive/folders/162UT-DrtNrqHFPfBJFRVUyu01woSnW9Z?usp=sharing","category":"Môn chuyên ngành","theme":3,"shared":true,"sharedType":"specialized"},
    {"id":"shared-specialized-04","name":"Học máy và Trí tuệ nhân tạo","url":"https://drive.google.com/drive/folders/1_r6DktlkPSSJGLMOheI4aus-THQn6WkT?usp=sharing","category":"Môn chuyên ngành","theme":4,"shared":true,"sharedType":"specialized"},
    {"id":"shared-specialized-05","name":"Kỹ thuật siêu cao tần","url":"https://drive.google.com/drive/folders/1e8pg72FSEhweLbfRHAGoL7rBU5ZcLxU_?usp=sharing","category":"Môn chuyên ngành","theme":5,"shared":true,"sharedType":"specialized"},
    {"id":"shared-specialized-06","name":"Lập trình hướng đối tượng và kỹ thuật phần mềm","url":"https://drive.google.com/drive/folders/1Jx-mTtqAWWvyqhpnFbtPL7j7vRmZO7Iu?usp=sharing","category":"Môn chuyên ngành","theme":6,"shared":true,"sharedType":"specialized"},
    {"id":"shared-specialized-07","name":"Thiết kế vi mạch tương tự","url":"https://drive.google.com/drive/folders/1mfaXrPSy6zbapvlp92sSw0_P9kD-L5zo?usp=sharing","category":"Môn chuyên ngành","theme":7,"shared":true,"sharedType":"specialized"}
  ];

const electiveSubjects = [
  {id:'shared-elective-01',name:'Thông tin di động',url:'https://drive.google.com/drive/folders/1iVCg7_o3CBY_rOPvhw86TzBeYNQfbV0_?usp=sharing',category:'Môn tự chọn chuyên ngành',theme:1,shared:true,sharedType:'elective'},
  {id:'shared-elective-02',name:'Thông tin số',url:'https://drive.google.com/drive/folders/1qT7HOAZLcO4ArhRTMPkOP8xc9sKYNYhI?usp=sharing',category:'Môn tự chọn chuyên ngành',theme:2,shared:true,sharedType:'elective'}
];
const english1Subjects = [
  {id:'shared-english1-01',name:'Tiếng Anh giao tiếp 1',url:'https://drive.google.com/drive/folders/1qjHpDZfQ6bHxrvitaj6pj3c28ju4M2rE?usp=sharing',category:'Tiếng Anh giao tiếp 1',theme:1,shared:true,sharedType:'english1'}
];
const english2Subjects = [
  {id:'shared-english2-01',name:'Tiếng Anh giao tiếp 2',url:'https://drive.google.com/drive/folders/1FgLx26U208t_0spCRyvJVAgSLUqS-CaR?usp=sharing',category:'Tiếng Anh giao tiếp 2',theme:1,shared:true,sharedType:'english2'}
];
  const oldDemoIds = new Set(['demo-riscv','demo-stm','demo-esp','demo-kicad','demo-github','demo-freertos']);
  const VALID_CAT = new Set(subjectNames);
  function loadResources() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        const data = JSON.parse(stored);
        if (!Array.isArray(data)) return [];
        return data.filter(item => item && typeof item.id === 'string' && typeof item.name === 'string' && typeof item.url === 'string')
          .map(item => ({...item, category: VALID_CAT.has(item.category) ? item.category : 'Chưa phân loại', favorite: !!item.favorite}));
      }
      // Giữ lại link người dùng đã lưu ở bản trước, nhưng loại các link demo có sẵn.
      const legacy = localStorage.getItem(OLD_STORAGE_KEY);
      if (!legacy) return [];
      const data = JSON.parse(legacy);
      if (!Array.isArray(data)) return [];
      return data.filter(item => item && typeof item.id === 'string' && !oldDemoIds.has(item.id) && typeof item.url === 'string' && typeof item.name === 'string')
        .map(item => ({...item, category:VALID_CAT.has(item.category)?item.category:'Chưa phân loại', favorite:!!item.favorite}));
    } catch (error) { console.warn('Không đọc được thư viện:', error); return []; }
  }
  let resources = loadResources();
  let activeCategory = 'Môn đại cương';
  let searchTerm = '';
  const resourceCount = $('#resource-count');
  const filterRow = $('#filter-row');
  const subjectGrid = $('#subject-grid');
  const categoryLabel = $('#resource-active-label');
  const searchInput = $('#resource-search');
  const dropdown = $('#link-category');
  const categoryOptions = subjectNames.map(cat => `<option value="${esc(cat)}">${esc(cat)}</option>`).join('');
  function save() {
    try {localStorage.setItem(STORAGE_KEY, JSON.stringify(resources));}
    catch {toast('Không lưu được dữ liệu. Hãy kiểm tra quyền lưu trữ của trình duyệt.');}
  }
  function visibleResources() {
    const term = searchTerm.trim().toLocaleLowerCase('vi');
    return [...generalSubjects, ...foundationSubjects, ...specializedSubjects, ...electiveSubjects, ...english1Subjects, ...english2Subjects, ...resources].filter(item =>
      (activeCategory === 'all' || (activeCategory === 'favorites' ? item.favorite : item.category === activeCategory)) &&
      [item.name, item.category, item.description || ''].join(' ').toLocaleLowerCase('vi').includes(term)
    );
  }
  function categorySelector(item) {
    return `<div class="resource-card-edit"><label for="cat-${esc(item.id)}">Nhóm môn:</label><select id="cat-${esc(item.id)}" data-move-id="${esc(item.id)}" aria-label="Chọn nhóm môn học cho ${esc(item.name)}">${item.category === 'Chưa phân loại' ? '<option value="Chưa phân loại">Chưa phân loại</option>':''}${subjectNames.map(cat => `<option value="${esc(cat)}" ${item.category===cat?'selected':''}>${esc(cat)}</option>`).join('')}</select></div>`;
  }
  function render() {
    const visible = visibleResources();
    if (resourceCount) resourceCount.textContent = String(visible.length);
    grid.classList.toggle('general-course-list', visible.some(item => item.shared));
    const heading = $('#library-list-title');
    const headingMap = {'Môn đại cương':'MÔN ĐẠI CƯƠNG','Môn cơ sở ngành':'MÔN CƠ SỞ NGÀNH','Môn chuyên ngành':'MÔN CHUYÊN NGÀNH','Môn tự chọn chuyên ngành':'MÔN TỰ CHỌN CHUYÊN NGÀNH','Tiếng Anh giao tiếp 1':'TIẾNG ANH GIAO TIẾP 1','Tiếng Anh giao tiếp 2':'TIẾNG ANH GIAO TIẾP 2'};
    if (heading) heading.textContent = headingMap[activeCategory] || 'DANH SÁCH TÀI LIỆU';
    categoryLabel.textContent = activeCategory === 'all' ? 'Tất cả tài liệu' : activeCategory === 'favorites' ? 'Các link đã đánh dấu yêu thích' : activeCategory;
    subjectGrid.querySelectorAll('button[data-category]').forEach(button => {
      const active = button.dataset.category === activeCategory;
      button.classList.toggle('is-selected',active);
      button.setAttribute('aria-pressed',String(active));
    });
    $$('.subject-count').forEach(label => {
      const names = [...generalSubjects, ...foundationSubjects, ...specializedSubjects, ...electiveSubjects, ...english1Subjects, ...english2Subjects, ...resources]
        .filter(item => item.category === label.dataset.countFor)
        .map(item => item.name.trim().toLocaleLowerCase('vi'));
      label.textContent = String(new Set(names).size);
    });
    filterRow.querySelectorAll('button[data-category]').forEach(button => {
      const active = button.dataset.category === activeCategory;
      button.classList.toggle('active',active);
      button.setAttribute('aria-pressed',String(active));
    });
    if (visible.length === 0) {
      grid.classList.remove('general-course-list');
      grid.innerHTML = `<div class="empty-state"><h3>${searchTerm ? 'Không tìm thấy tài liệu phù hợp' : 'Chưa có tài liệu trong mục này'}</h3><p>${searchTerm ? 'Hãy thử tìm bằng từ khóa khác.' : 'Bạn có thể bắt đầu bằng nút “Thêm tài liệu” để lưu link đầu tiên.'}</p></div>`;
      return;
    }
    grid.innerHTML = visible.map(item => {
      const url = safeUrl(item.url);
      if (item.shared) {
        const number = String(item.theme).padStart(2, '0');
        const className = item.sharedType === 'foundation' ? `foundation-course-${item.theme}`
          : item.sharedType === 'specialized' ? `specialized-course-${item.theme}`
          : item.sharedType === 'elective' ? `elective-course-${item.theme}`
          : item.sharedType === 'english1' ? `english1-course-${item.theme}`
          : item.sharedType === 'english2' ? `english2-course-${item.theme}`
          : `general-course-${item.theme}`;
        return `<article class="general-course-card ${className}${((item.sharedType === 'foundation' && item.theme >= 11) || item.sharedType === 'specialized' || item.sharedType === 'elective' || item.sharedType === 'english1' || item.sharedType === 'english2') ? ' premium-tech-card' : ''}">
          <div class="general-course-main">
            <span class="general-course-index">${number}</span>
            <h3>${esc(item.name)}</h3>
            <p>Mời bạn tải tài liệu tại:</p>
            <a class="general-drive-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer" aria-label="Mở tài liệu ${esc(item.name)} trên Google Drive">
              <span class="general-drive-icon" aria-hidden="true">${icon('cloud')}</span>
              <span class="general-drive-url">${esc(item.url)}</span>
              ${icon('arrow-up','icon icon-sm')}
            </a>
          </div>
          <div aria-hidden="true" class="general-course-art"></div>
        </article>`;
      }
      return `<article class="resource-card"><div class="resource-card-icon">${icon('book')}</div><div class="resource-card-content"><div class="resource-card-category">${esc(item.category)}</div><h3>${esc(item.name)}</h3><p>${esc(item.description || '')}</p>${categorySelector(item)}<div class="resource-card-bottom">${url ? `<a class="resource-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer">Mở tài liệu ${icon('arrow-up','icon icon-sm')}</a>` : '<span class="resource-link">URL không hợp lệ</span>'}<div class="resource-actions"><button class="icon-button ${item.favorite ? 'is-favorite' : ''}" type="button" data-action="favorite" data-id="${esc(item.id)}" aria-label="${item.favorite ? 'Bỏ yêu thích' : 'Yêu thích'} ${esc(item.name)}" title="Yêu thích" aria-pressed="${!!item.favorite}">${icon('heart','icon icon-sm')}</button><button class="icon-button" type="button" data-action="delete" data-id="${esc(item.id)}" aria-label="Xóa ${esc(item.name)}" title="Xóa tài liệu">${icon('trash','icon icon-sm')}</button></div></div></div></article>`;
    }).join('');
  }
  function selectCategory(category, scroll = false) {
    activeCategory = category;
    searchTerm = '';
    searchInput.value = '';
    render();
    if (scroll) $('#resource-list').scrollIntoView({behavior:'smooth',block:'start'});
  }
  subjectGrid.addEventListener('click', event => {
    const button = event.target.closest('button[data-category]');
    if (button) selectCategory(button.dataset.category);
  });
  filterRow.addEventListener('click', event => {
    const button = event.target.closest('button[data-category]');
    if (button) selectCategory(button.dataset.category);
  });
  searchInput.addEventListener('input', event => {searchTerm=event.target.value;render();});
  grid.addEventListener('change', event => {
    const selected = event.target.closest('select[data-move-id]');
    if (!selected) return;
    const item = resources.find(entry => entry.id===selected.dataset.moveId);
    if (!item || !VALID_CAT.has(selected.value)) return;
    item.category=selected.value;
    save();render();toast('Đã chuyển tài liệu sang nhóm mới.');
  });
  grid.addEventListener('click', event => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const index = resources.findIndex(item=>item.id===button.dataset.id);
    if (index < 0) return;
    if (button.dataset.action === 'favorite') {
      resources[index].favorite = !resources[index].favorite;
      const value = resources[index].favorite;
      save();render();toast(value?'Đã thêm vào yêu thích.':'Đã bỏ yêu thích.');
    } else if (button.dataset.action === 'delete') {
      if (!window.confirm(`Xóa tài liệu “${resources[index].name}”?`)) return;
      resources.splice(index,1);save();render();toast('Đã xóa tài liệu.');
    }
  });
  $('#add-link').addEventListener('click', () => {
    $('#link-form').reset();
    dropdown.value = VALID_CAT.has(activeCategory) ? activeCategory : subjectNames[0];
    openModal('link-modal');
    $('#link-name').focus();
  });
  $('#link-form').addEventListener('submit', event => {
    event.preventDefault();
    const form=event.currentTarget;
    const name=form.elements.name.value.trim();
    const url=safeUrl(form.elements.url.value.trim());
    const category=form.elements.category.value;
    const description=form.elements.description.value.trim();
    if (!name || !url || !VALID_CAT.has(category)) {toast('Tên, link hoặc nhóm môn học không hợp lệ.');return;}
    const id = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : 'user-'+Date.now().toString(36)+'-'+Math.floor(Math.random()*100000);
    resources.unshift({id,name,url,category,description,favorite:false});
    save();
    selectCategory(category);
    closeModal('link-modal');
    toast('Đã thêm tài liệu.');
  });
  $('#restore-links').addEventListener('click', () => {
    if (!window.confirm('Xóa toàn bộ link đang lưu trong thư viện trên trình duyệt này?')) return;
    resources=[];save();selectCategory('all');toast('Đã xóa danh sách tài liệu.');
  });
  $('#export-links').addEventListener('click', () => {
    const blob=new Blob([JSON.stringify(resources,null,2)],{type:'application/json;charset=utf-8'});
    const url=URL.createObjectURL(blob);
    const link=document.createElement('a');link.href=url;link.download='nguyen-huu-nhon-tai-lieu.json';
    document.body.appendChild(link);link.click();link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Đã xuất danh sách tài liệu JSON.');
  });
  render();
})();
