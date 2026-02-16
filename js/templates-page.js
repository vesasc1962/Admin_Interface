// Templates page controller:
// - Supports EN/HI/MR template content switching
// - Keeps page chrome/actions stable while switching language
// - Stores templates with translations (see js/templates.js) and keeps EN top-level fields for compatibility
(function () {
    const TEMPLATE_LANG_KEY = 'SMART_BOARD_TEMPLATE_LANG';
    const VALID_LANGS = ['en', 'hi', 'mr'];
    const UI_LANG = 'en';
    const NOTICE_BOARD_PRESET_COLORS = [
        '#8B1E1E', '#9A2A2A', '#7F1D1D', '#A21C2F', '#944214',
        '#6B1E3A', '#B63A3A', '#C1452D', '#7A1F5C', '#2E5E8A',
        '#1F6F5A', '#6D5F0F', '#4F46A5', '#9D174D', '#155E75',
        '#7C2D12', '#4D7C0F', '#A16207', '#374151'
    ];

    const CATEGORY_LABELS = {
        Academic: { en: 'Academic', hi: 'शैक्षणिक', mr: 'शैक्षणिक' },
        Event: { en: 'Event', hi: 'कार्यक्रम', mr: 'कार्यक्रम' },
        Emergency: { en: 'Emergency', hi: 'आपत्कालीन', mr: 'आपत्कालीन' },
        Holiday: { en: 'Holiday', hi: 'सुट्टी', mr: 'सुट्टी' },
        Motivation: { en: 'Motivation', hi: 'प्रेरणा', mr: 'प्रेरणा' },
        General: { en: 'General', hi: 'सामान्य', mr: 'सामान्य' }
    };

    const I18N = {
        en: {
            pageTitle: 'Notice Templates',
            pageSubtitle: 'Pre-built marquee templates with editable title, content, and priority',
            hint: 'Select a template, update content if needed, and publish from this page.',
            addTemplate: 'Add Template',
            totalTemplates: 'Total Templates',
            categories: 'Categories',
            emergencyTemplates: 'Emergency Templates',
            all: 'All',
            noTemplates: 'No templates found for this category.',
            noDescription: 'No description',
            priorityNormal: 'Normal',
            priorityEmergency: 'Emergency',
            useTemplate: 'Use Template',
            edit: 'Edit',
            delete: 'Delete',
            modalCreate: 'Create Template',
            modalEdit: 'Edit Template',
            labelCategory: 'Category *',
            labelPriority: 'Default Priority *',
            labelName: 'Template Name *',
            labelDesc: 'Short Description',
            descPlaceholder: 'One line summary for admin list',
            labelTitle: 'Default Notice Title *',
            labelContent: 'Default Marquee Content *',
            cancel: 'Cancel',
            save: 'Save Template',
            templateNotFound: 'Template not found',
            confirmDelete: 'Delete template \"{name}\"?',
            toastDeleted: 'Template deleted',
            toastUpdated: 'Template updated',
            toastCreated: 'Template created',
            requiredAllLang: 'Template name, title, and content are required in EN/HI/MR'
        },
        hi: {
            pageTitle: 'सूचना टेम्पलेट्स',
            pageSubtitle: 'शीर्षक, संदेश और प्राथमिकता संपादित कर उपयोग करने के लिए तैयार टेम्पलेट्स',
            hint: 'टेम्पलेट चुनें और सीधे सूचना बनाने पर जाएं।',
            addTemplate: 'टेम्पलेट जोड़ें',
            totalTemplates: 'कुल टेम्पलेट्स',
            categories: 'श्रेणियाँ',
            emergencyTemplates: 'आपत्कालीन टेम्पलेट्स',
            all: 'सभी',
            noTemplates: 'इस श्रेणी के लिए कोई टेम्पलेट नहीं मिला।',
            noDescription: 'कोई विवरण नहीं',
            priorityNormal: 'सामान्य',
            priorityEmergency: 'आपत्कालीन',
            useTemplate: 'टेम्पलेट उपयोग करें',
            edit: 'संपादित करें',
            delete: 'हटाएँ',
            modalCreate: 'टेम्पलेट बनाएँ',
            modalEdit: 'टेम्पलेट संपादित करें',
            labelCategory: 'श्रेणी *',
            labelPriority: 'डिफ़ॉल्ट प्राथमिकता *',
            labelName: 'टेम्पलेट नाम *',
            labelDesc: 'संक्षिप्त विवरण',
            descPlaceholder: 'एडमिन सूची के लिए एक पंक्ति',
            labelTitle: 'डिफ़ॉल्ट सूचना शीर्षक *',
            labelContent: 'डिफ़ॉल्ट मार्की सामग्री *',
            cancel: 'रद्द करें',
            save: 'सेव करें',
            templateNotFound: 'टेम्पलेट नहीं मिला',
            confirmDelete: 'टेम्पलेट \"{name}\" हटाएँ?',
            toastDeleted: 'टेम्पलेट हटाया गया',
            toastUpdated: 'टेम्पलेट अपडेट हुआ',
            toastCreated: 'टेम्पलेट बनाया गया',
            requiredAllLang: 'EN/हि/मराठी में नाम, शीर्षक और सामग्री आवश्यक हैं'
        },
        mr: {
            pageTitle: 'सूचना टेम्पलेट्स',
            pageSubtitle: 'शीर्षक, मजकूर आणि प्राधान्य संपादित करून वापरण्यासाठी तयार टेम्पलेट्स',
            hint: 'टेम्पलेट निवडा आणि थेट सूचना तयार करण्याकडे जा.',
            addTemplate: 'टेम्पलेट जोडा',
            totalTemplates: 'एकूण टेम्पलेट्स',
            categories: 'वर्ग',
            emergencyTemplates: 'आपत्कालीन टेम्पलेट्स',
            all: 'सर्व',
            noTemplates: 'या वर्गासाठी टेम्पलेट उपलब्ध नाही.',
            noDescription: 'वर्णन नाही',
            priorityNormal: 'सामान्य',
            priorityEmergency: 'आपत्कालीन',
            useTemplate: 'टेम्पलेट वापरा',
            edit: 'संपादित',
            delete: 'हटवा',
            modalCreate: 'टेम्पलेट तयार करा',
            modalEdit: 'टेम्पलेट संपादित करा',
            labelCategory: 'वर्ग *',
            labelPriority: 'डीफॉल्ट प्राधान्य *',
            labelName: 'टेम्पलेट नाव *',
            labelDesc: 'लहान वर्णन',
            descPlaceholder: 'अ‍ॅडमिन सूचीसाठी एक ओळ',
            labelTitle: 'डीफॉल्ट सूचना शीर्षक *',
            labelContent: 'डीफॉल्ट मार्की मजकूर *',
            cancel: 'रद्द',
            save: 'सेव्ह करा',
            templateNotFound: 'टेम्पलेट सापडले नाही',
            confirmDelete: 'टेम्पलेट \"{name}\" हटवायचे?',
            toastDeleted: 'टेम्पलेट हटवले',
            toastUpdated: 'टेम्पलेट अपडेट झाले',
            toastCreated: 'टेम्पलेट तयार झाले',
            requiredAllLang: 'EN/हि/मराठी मध्ये नाव, शीर्षक आणि मजकूर आवश्यक आहेत'
        }
    };

    let selectedCategory = 'All';
    let editingTemplateId = '';
    let currentLang = readTemplateLanguage();
    let modalLang = currentLang;
    let publishTemplateId = '';
    let publishBoards = [];
    let selectedNoticeBoardColor = '';

    function escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function t(key, vars) {
        const dict = I18N[UI_LANG] || I18N.en;
        let text = String(dict[key] || I18N.en[key] || '');
        const params = vars && typeof vars === 'object' ? vars : {};
        Object.keys(params).forEach((k) => {
            text = text.split(`{${k}}`).join(String(params[k]));
        });
        return text;
    }

    function labelCategory(category) {
        if (category === 'All') return I18N.en.all;
        const map = CATEGORY_LABELS[category];
        if (!map) return String(category);
        return map.en || String(category);
    }

    function toLocalDateTimeInputValue(date) {
        const local = new Date(date.getTime());
        local.setMinutes(local.getMinutes() - local.getTimezoneOffset());
        return local.toISOString().slice(0, 16);
    }

    function getResolvedServerOrigin() {
        try {
            const settings = (typeof getAdminSettings === 'function')
                ? getAdminSettings()
                : (window.adminSettings || {});
            const raw = (settings && settings.SERVER_URL) || (window.config && window.config.SERVER_URL) || '';
            return new URL(String(raw || '')).origin;
        } catch (error) {
            return '';
        }
    }

    function toAbsoluteMediaUrl(pathOrUrl) {
        const value = String(pathOrUrl || '').trim();
        if (!value) return '';
        if (/^https?:\/\//i.test(value)) return value;

        const origin = getResolvedServerOrigin();
        if (!origin) return value;

        if (value.startsWith('/')) return `${origin}${value}`;
        return `${origin}/${value}`;
    }

    function deriveAutoNoticeBoardColor(seedText) {
        const palette = ['#8B1E1E', '#9A2A2A', '#7F1D1D', '#A21C2F', '#944214', '#6B1E3A', '#B63A3A'];
        const source = String(seedText || 'template').trim() || 'template';
        let hash = 0;
        for (let i = 0; i < source.length; i += 1) {
            hash = ((hash << 5) - hash) + source.charCodeAt(i);
            hash |= 0;
        }
        const index = Math.abs(hash) % palette.length;
        return palette[index];
    }

    function isValidHexColor(value) {
        return /^#[0-9A-Fa-f]{6}$/.test(String(value || '').trim());
    }

    function combineLocalDateTime(dateValue, timeValue) {
        if (!dateValue || !timeValue) return '';
        return `${dateValue}T${timeValue}`;
    }

    function getSelectedTemplateRecurringDays() {
        const checkboxes = document.querySelectorAll('input[name="templatePublishRecurDays"]:checked');
        return Array.from(checkboxes).map((cb) => cb.value).join(',');
    }

    function syncTemplatePublishWindowFromRecurring() {
        const recurringEnabled = Boolean(
            document.getElementById('templatePublishRecurring')
            && document.getElementById('templatePublishRecurring').checked
        );
        if (!recurringEnabled) return;

        const recurringStartDate = document.getElementById('templatePublishRecurringStartDate').value;
        const recurringEndDate = document.getElementById('templatePublishRecurringEndDate').value;
        const dailyStartTime = document.getElementById('templatePublishDailyStartTime').value;
        const dailyEndTime = document.getElementById('templatePublishDailyEndTime').value;

        const syncedStart = combineLocalDateTime(recurringStartDate, dailyStartTime);
        const syncedEnd = combineLocalDateTime(recurringEndDate, dailyEndTime);

        if (syncedStart) {
            document.getElementById('templatePublishStartTime').value = syncedStart;
        }
        if (syncedEnd) {
            document.getElementById('templatePublishEndTime').value = syncedEnd;
        }
    }

    function toggleTemplatePublishRecurring() {
        const recurringToggle = document.getElementById('templatePublishRecurring');
        const panel = document.getElementById('templatePublishRecurringPanel');
        if (!recurringToggle || !panel) return;

        const recurringEnabled = Boolean(recurringToggle.checked);
        panel.style.display = recurringEnabled ? 'block' : 'none';

        if (recurringEnabled) {
            const startTime = document.getElementById('templatePublishStartTime').value;
            const endTime = document.getElementById('templatePublishEndTime').value;
            const recurringStartInput = document.getElementById('templatePublishRecurringStartDate');
            const recurringEndInput = document.getElementById('templatePublishRecurringEndDate');

            if (recurringStartInput && !recurringStartInput.value && startTime) {
                recurringStartInput.value = startTime.slice(0, 10);
            }
            if (recurringEndInput && !recurringEndInput.value && endTime) {
                recurringEndInput.value = endTime.slice(0, 10);
            }

            syncTemplatePublishWindowFromRecurring();
        }
    }

    function setNoticeBoardPaletteSelection(color) {
        selectedNoticeBoardColor = isValidHexColor(color) ? color : '';

        const autoButton = document.getElementById('templatePublishNoticeBoardColorAuto');
        if (autoButton) autoButton.classList.toggle('active', !selectedNoticeBoardColor);

        document.querySelectorAll('.notice-board-color-swatch').forEach((button) => {
            const swatchColor = String(button.dataset.color || '').trim().toUpperCase();
            button.classList.toggle(
                'active',
                selectedNoticeBoardColor && swatchColor === selectedNoticeBoardColor.toUpperCase()
            );
        });
    }

    function renderNoticeBoardPalette() {
        const grid = document.getElementById('templatePublishNoticeBoardColorGrid');
        if (!grid) return;

        grid.innerHTML = NOTICE_BOARD_PRESET_COLORS.map((color) => `
            <button
                type="button"
                class="notice-board-color-swatch"
                data-color="${color}"
                style="background:${color};"
                title="${color}"
                aria-label="Select color ${color}">
            </button>
        `).join('');

        grid.addEventListener('click', (event) => {
            const target = event.target;
            if (!target || !target.classList || !target.classList.contains('notice-board-color-swatch')) return;
            setNoticeBoardPaletteSelection(target.dataset.color || '');
        });

        const autoButton = document.getElementById('templatePublishNoticeBoardColorAuto');
        if (autoButton) {
            autoButton.addEventListener('click', () => {
                setNoticeBoardPaletteSelection('');
            });
        }

        setNoticeBoardPaletteSelection('');
    }

    function getCategoryIcon(category) {
        const map = {
            Academic: 'academic',
            Event: 'event',
            Emergency: 'emergency',
            Holiday: 'holiday',
            Motivation: 'motivation',
            General: 'general'
        };
        return map[category] || 'general';
    }

    function readTemplateLanguage() {
        const stored = String(localStorage.getItem(TEMPLATE_LANG_KEY) || '').trim().toLowerCase();
        return VALID_LANGS.includes(stored) ? stored : 'en';
    }

    function persistTemplateLanguage(lang) {
        localStorage.setItem(TEMPLATE_LANG_KEY, lang);
    }

    function syncLanguageButtons() {
        document.querySelectorAll('.lang-btn').forEach((btn) => {
            btn.classList.toggle('active', btn.dataset.lang === currentLang);
        });
    }

    function templateHasLanguage(template, lang) {
        if (!template) return false;
        if (lang === 'en') return Boolean(template.name && template.title && template.content);
        const tx = template.translations && template.translations[lang];
        if (!tx) return false;
        return Boolean(String(tx.name || '').trim() && String(tx.title || '').trim() && String(tx.content || '').trim());
    }

    function getTemplateText(template, field, lang) {
        const l = lang || currentLang;
        if (!template) return '';
        if (l === 'en') return String(template[field] || '').trim();
        const tx = template.translations && template.translations[l];
        return String(tx && tx[field] || '').trim();
    }

    function applyTemplateI18n() {
        const pageTitle = t('pageTitle');
        const pageSubtitle = t('pageSubtitle');

        const h1 = document.querySelector('.page-header h1');
        const p = document.querySelector('.page-header p');
        if (h1) h1.textContent = pageTitle;
        if (p) p.textContent = pageSubtitle;

        const topTitle = document.querySelector('.top-header-title');
        const topSub = document.querySelector('.top-header-subtitle');
        if (topTitle) topTitle.textContent = pageTitle;
        if (topSub) topSub.textContent = pageSubtitle;

        document.title = `${pageTitle} - Smart Board Admin`;

        const hint = document.getElementById('tplHint');
        if (hint) hint.textContent = t('hint');
        const addBtn = document.getElementById('addTemplateBtnLabel');
        if (addBtn) addBtn.textContent = t('addTemplate');
        const lblTotal = document.getElementById('labelTotalTemplates');
        if (lblTotal) lblTotal.textContent = t('totalTemplates');
        const lblCats = document.getElementById('labelCategories');
        if (lblCats) lblCats.textContent = t('categories');
        const lblE = document.getElementById('labelEmergencyTemplates');
        if (lblE) lblE.textContent = t('emergencyTemplates');

        const labelTemplateCategory = document.getElementById('labelTemplateCategory');
        if (labelTemplateCategory) labelTemplateCategory.textContent = t('labelCategory');
        const labelTemplatePriority = document.getElementById('labelTemplatePriority');
        if (labelTemplatePriority) labelTemplatePriority.textContent = t('labelPriority');
        const labelTemplateName = document.getElementById('labelTemplateName');
        if (labelTemplateName) labelTemplateName.textContent = t('labelName');
        const labelTemplateDescription = document.getElementById('labelTemplateDescription');
        if (labelTemplateDescription) labelTemplateDescription.textContent = t('labelDesc');
        const labelTemplateTitle = document.getElementById('labelTemplateTitle');
        if (labelTemplateTitle) labelTemplateTitle.textContent = t('labelTitle');
        const labelTemplateContent = document.getElementById('labelTemplateContent');
        if (labelTemplateContent) labelTemplateContent.textContent = t('labelContent');
        const btnCancel = document.getElementById('btnCancelLabel');
        if (btnCancel) btnCancel.textContent = t('cancel');
        const btnSave = document.getElementById('btnSaveLabel');
        if (btnSave) btnSave.textContent = t('save');

        // Update all modal labels to current UI language.
        const labelMap = [
            { forPrefix: 'templateName_', text: t('labelName') },
            { forPrefix: 'templateDescription_', text: t('labelDesc') },
            { forPrefix: 'templateTitle_', text: t('labelTitle') },
            { forPrefix: 'templateContent_', text: t('labelContent') }
        ];
        labelMap.forEach((entry) => {
            document.querySelectorAll(`label[for^="${entry.forPrefix}"]`).forEach((label) => {
                label.textContent = entry.text;
            });
        });
        document.querySelectorAll('input[id^="templateDescription_"]').forEach((input) => {
            input.placeholder = t('descPlaceholder');
        });

        // Translate select option labels without changing values.
        document.querySelectorAll('#templateCategory option[data-category]').forEach((opt) => {
            const key = opt.dataset.category;
            opt.textContent = labelCategory(key);
        });
        document.querySelectorAll('#templatePriority option[data-priority]').forEach((opt) => {
            opt.textContent = opt.dataset.priority === 'emergency' ? t('priorityEmergency') : t('priorityNormal');
        });
    }

    function setTemplateLanguage(lang) {
        if (!VALID_LANGS.includes(lang)) return;
        currentLang = lang;
        persistTemplateLanguage(lang);
        syncLanguageButtons();
        applyTemplateI18n();
        refreshTemplateView();
    }

    function setTemplateModalLanguage(lang) {
        if (!VALID_LANGS.includes(lang)) return;
        modalLang = lang;
        document.querySelectorAll('.modal-lang-tab').forEach((btn) => {
            btn.classList.toggle('active', btn.dataset.lang === modalLang);
        });
        document.querySelectorAll('.modal-lang-panel').forEach((panel) => {
            panel.classList.toggle('active', panel.dataset.lang === modalLang);
        });
    }

    function getAllTemplates() {
        return window.noticeTemplateStore.getTemplates();
    }

    function getTemplatesForLanguage() {
        return getAllTemplates().filter((tpl) => templateHasLanguage(tpl, currentLang));
    }

    function getFilteredTemplates() {
        const templates = getTemplatesForLanguage();
        if (selectedCategory === 'All') return templates;
        return templates.filter((item) => item.category === selectedCategory);
    }

    function updateStats() {
        const templates = getTemplatesForLanguage();
        const emergency = templates.filter((item) => item.priority === 'emergency').length;
        const categories = Array.from(new Set(templates.map((item) => item.category).filter(Boolean)));

        const total = document.getElementById('totalTemplates');
        const cats = document.getElementById('totalCategories');
        const emg = document.getElementById('emergencyTemplates');
        if (total) total.textContent = String(templates.length);
        if (cats) cats.textContent = String(categories.length);
        if (emg) emg.textContent = String(emergency);
    }

    function getCategoriesForFilters() {
        const templates = getTemplatesForLanguage();
        const available = new Set(templates.map((t) => t.category));
        const ordered = window.noticeTemplateStore.getCategories().filter((c) => available.has(c));
        return ['All', ...ordered];
    }

    function renderFilters() {
        const categories = getCategoriesForFilters();
        const container = document.getElementById('categoryFilters');
        if (!container) return;

        container.innerHTML = categories.map((category) => `
            <button
                type="button"
                class="template-filter-btn ${selectedCategory === category ? 'active' : ''}"
                onclick="setCategoryFilter('${category}')"
            >
                ${escapeHtml(labelCategory(category))}
            </button>
        `).join('');
    }

    function renderTemplates() {
        const templates = getFilteredTemplates();
        const container = document.getElementById('templatesGrid');
        if (!container) return;

        if (!templates.length) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>${escapeHtml(t('noTemplates'))}</p>
                </div>
            `;
            return;
        }

        container.innerHTML = templates.map((template) => {
            const iconSvg = window.noticeTemplateStore.getIconSvg(template.iconKey || getCategoryIcon(template.category));
            const name = getTemplateText(template, 'name');
            const desc = getTemplateText(template, 'description') || t('noDescription');
            const content = getTemplateText(template, 'content') || '';
            const contentSnippet = content.length > 150 ? `${content.slice(0, 150)}...` : content;
            const priorityClass = template.priority === 'emergency' ? 'emergency' : '';
            const priorityLabel = template.priority === 'emergency' ? t('priorityEmergency') : t('priorityNormal');

            return `
                <article class="template-card">
                    <div class="template-head">
                        <div class="template-head-left">
                            <span class="template-icon">${iconSvg}</span>
                            <div class="template-title-wrap">
                                <div class="template-title">${escapeHtml(name)}</div>
                                <span class="template-category">${escapeHtml(labelCategory(template.category))}</span>
                            </div>
                        </div>
                    </div>
                    <p class="template-description">${escapeHtml(desc)}</p>
                    <div class="template-snippet">${escapeHtml(contentSnippet)}</div>
                    <div class="template-footer">
                        <span class="template-priority">
                            <span class="template-dot ${priorityClass}"></span>${escapeHtml(priorityLabel)}
                        </span>
                        <div class="template-actions">
                            <button type="button" class="btn btn-primary btn-sm" onclick="useTemplate('${template.templateId}')">${escapeHtml(t('useTemplate'))}</button>
                            <button type="button" class="btn btn-secondary btn-sm" onclick="openTemplateModal('${template.templateId}')">${escapeHtml(t('edit'))}</button>
                            <button type="button" class="btn btn-danger btn-sm" onclick="removeTemplate('${template.templateId}')">${escapeHtml(t('delete'))}</button>
                        </div>
                    </div>
                </article>
            `;
        }).join('');
    }

    function refreshTemplateView() {
        updateStats();
        renderFilters();
        renderTemplates();
    }

    function setCategoryFilter(category) {
        selectedCategory = category;
        renderFilters();
        renderTemplates();
    }

    async function loadPublishBoards() {
        try {
            const result = await api.get('/boards');
            publishBoards = Array.isArray(result && result.boards) ? result.boards : [];
        } catch (error) {
            console.error('Load boards error:', error);
            publishBoards = [];
        }
    }

    function syncPublishBoardStyles() {
        document.querySelectorAll('.template-publish-board-checkbox').forEach((checkbox) => {
            const tile = checkbox.closest('.board-checkbox');
            if (tile) tile.classList.toggle('selected', checkbox.checked);
        });
    }

    function renderPublishBoards() {
        const list = document.getElementById('templatePublishBoardsList');
        if (!list) return;

        if (!publishBoards.length) {
            list.innerHTML = '<p class="text-gray">No boards registered yet.</p>';
            return;
        }

        list.innerHTML = publishBoards.map((board) => `
            <label class="board-checkbox">
                <input type="checkbox" class="template-publish-board-checkbox" value="${escapeHtml(board.boardId)}">
                <div>
                    <strong>${escapeHtml(board.boardId)}</strong>
                    <small style="display:block;color:var(--gray);">Room: ${escapeHtml(board.roomNumber == null ? '' : board.roomNumber)}</small>
                </div>
            </label>
        `).join('');
        syncPublishBoardStyles();
    }

    function togglePublishAllBoards() {
        const checked = Boolean(document.getElementById('templatePublishSelectAll') && document.getElementById('templatePublishSelectAll').checked);
        document.querySelectorAll('.template-publish-board-checkbox').forEach((cb) => {
            cb.checked = checked;
        });
        syncPublishBoardStyles();
    }

    function closeTemplatePublishModal() {
        publishTemplateId = '';
        const showBoardToggle = document.getElementById('templatePublishShowNoticeBoard');
        if (showBoardToggle) showBoardToggle.checked = false;
        const boardOptions = document.getElementById('templateNoticeBoardOptions');
        if (boardOptions) boardOptions.style.display = 'none';
        setNoticeBoardPaletteSelection('');
        const imageInput = document.getElementById('templatePublishNoticeBoardImage');
        if (imageInput) imageInput.value = '';
        const recurringToggle = document.getElementById('templatePublishRecurring');
        if (recurringToggle) recurringToggle.checked = false;
        const recurringPanel = document.getElementById('templatePublishRecurringPanel');
        if (recurringPanel) recurringPanel.style.display = 'none';
        const recurringStartDate = document.getElementById('templatePublishRecurringStartDate');
        const recurringEndDate = document.getElementById('templatePublishRecurringEndDate');
        if (recurringStartDate) recurringStartDate.value = '';
        if (recurringEndDate) recurringEndDate.value = '';
        const dailyStart = document.getElementById('templatePublishDailyStartTime');
        const dailyEnd = document.getElementById('templatePublishDailyEndTime');
        if (dailyStart) dailyStart.value = '09:00';
        if (dailyEnd) dailyEnd.value = '17:00';
        document.querySelectorAll('input[name="templatePublishRecurDays"]').forEach((checkbox) => {
            checkbox.checked = ['1', '2', '3', '4', '5'].includes(String(checkbox.value));
        });
        const modal = document.getElementById('templatePublishModal');
        if (modal) modal.classList.remove('show');
    }

    async function useTemplate(templateId) {
        const id = String(templateId || '');
        const template = window.noticeTemplateStore.getTemplateById(id);
        if (!template) {
            showToast(t('templateNotFound'), 'error');
            return;
        }

        publishTemplateId = id;
        const templateName = getTemplateText(template, 'name') || template.name || '';
        const title = getTemplateText(template, 'title') || template.title || templateName;
        const content = getTemplateText(template, 'content') || template.content || '';
        const priority = template.priority === 'emergency' ? 'emergency' : 'normal';

        const now = new Date();
        const oneHourLater = new Date(now.getTime() + (60 * 60 * 1000));

        const nameEl = document.getElementById('templatePublishTemplateName');
        if (nameEl) nameEl.textContent = templateName || 'Template';
        const titleInput = document.getElementById('templatePublishTitle');
        if (titleInput) titleInput.value = title;
        const contentInput = document.getElementById('templatePublishContent');
        if (contentInput) contentInput.value = content;
        const priorityInput = document.getElementById('templatePublishPriority');
        if (priorityInput) priorityInput.value = priority;
        const startInput = document.getElementById('templatePublishStartTime');
        if (startInput) startInput.value = toLocalDateTimeInputValue(now);
        const endInput = document.getElementById('templatePublishEndTime');
        if (endInput) endInput.value = toLocalDateTimeInputValue(oneHourLater);
        const allBoardsCheckbox = document.getElementById('templatePublishSelectAll');
        if (allBoardsCheckbox) allBoardsCheckbox.checked = false;
        const showBoardToggle = document.getElementById('templatePublishShowNoticeBoard');
        if (showBoardToggle) showBoardToggle.checked = false;
        const boardOptions = document.getElementById('templateNoticeBoardOptions');
        if (boardOptions) boardOptions.style.display = 'none';
        setNoticeBoardPaletteSelection('');
        const imageInput = document.getElementById('templatePublishNoticeBoardImage');
        if (imageInput) imageInput.value = '';
        const recurringToggle = document.getElementById('templatePublishRecurring');
        if (recurringToggle) recurringToggle.checked = false;
        const recurringPanel = document.getElementById('templatePublishRecurringPanel');
        if (recurringPanel) recurringPanel.style.display = 'none';
        const recurringStartDate = document.getElementById('templatePublishRecurringStartDate');
        const recurringEndDate = document.getElementById('templatePublishRecurringEndDate');
        if (recurringStartDate) recurringStartDate.value = now.toISOString().slice(0, 10);
        if (recurringEndDate) recurringEndDate.value = oneHourLater.toISOString().slice(0, 10);
        const dailyStart = document.getElementById('templatePublishDailyStartTime');
        const dailyEnd = document.getElementById('templatePublishDailyEndTime');
        if (dailyStart) dailyStart.value = now.toTimeString().slice(0, 5);
        if (dailyEnd) dailyEnd.value = oneHourLater.toTimeString().slice(0, 5);
        document.querySelectorAll('input[name="templatePublishRecurDays"]').forEach((checkbox) => {
            checkbox.checked = ['1', '2', '3', '4', '5'].includes(String(checkbox.value));
        });

        await loadPublishBoards();
        renderPublishBoards();

        const modal = document.getElementById('templatePublishModal');
        if (modal) modal.classList.add('show');
    }

    function setModalValuesForLang(lang, tx) {
        const suffix = `_${lang}`;
        const get = (k) => tx && tx[k] ? String(tx[k]) : '';
        document.getElementById(`templateName${suffix}`).value = get('name');
        document.getElementById(`templateDescription${suffix}`).value = get('description');
        document.getElementById(`templateTitle${suffix}`).value = get('title');
        document.getElementById(`templateContent${suffix}`).value = get('content');
    }

    function openTemplateModal(templateId) {
        const id = String(templateId || '');
        editingTemplateId = id;
        const template = id ? window.noticeTemplateStore.getTemplateById(id) : null;

        document.getElementById('templateModalTitle').textContent = template ? t('modalEdit') : t('modalCreate');
        document.getElementById('templateCategory').value = template ? (template.category || 'General') : 'General';
        document.getElementById('templatePriority').value = template ? (template.priority || 'normal') : 'normal';

        const translations = template && template.translations ? template.translations : { en: null, hi: null, mr: null };
        setModalValuesForLang('en', translations.en || template || {});
        setModalValuesForLang('hi', translations.hi || {});
        setModalValuesForLang('mr', translations.mr || {});

        setTemplateModalLanguage(currentLang);
        document.getElementById('templateModal').classList.add('show');
    }

    function closeTemplateModal() {
        editingTemplateId = '';
        document.getElementById('templateForm').reset();
        document.getElementById('templateModal').classList.remove('show');
    }

    function removeTemplate(templateId) {
        const template = window.noticeTemplateStore.getTemplateById(templateId);
        if (!template) {
            showToast(t('templateNotFound'), 'error');
            return;
        }
        const name = getTemplateText(template, 'name') || template.name || '';
        if (!confirm(t('confirmDelete', { name }))) return;

        window.noticeTemplateStore.deleteTemplate(templateId);
        showToast(t('toastDeleted'), 'success');
        refreshTemplateView();
    }

    function readTranslationsFromModal() {
        const read = (lang) => ({
            name: document.getElementById(`templateName_${lang}`).value.trim(),
            description: document.getElementById(`templateDescription_${lang}`).value.trim(),
            title: document.getElementById(`templateTitle_${lang}`).value.trim(),
            content: document.getElementById(`templateContent_${lang}`).value.trim()
        });
        return { en: read('en'), hi: read('hi'), mr: read('mr') };
    }

    // Expose functions used by inline onclick handlers.
    window.setTemplateLanguage = setTemplateLanguage;
    window.setTemplateModalLanguage = setTemplateModalLanguage;
    window.setCategoryFilter = setCategoryFilter;
    window.useTemplate = useTemplate;
    window.openTemplateModal = openTemplateModal;
    window.closeTemplateModal = closeTemplateModal;
    window.closeTemplatePublishModal = closeTemplatePublishModal;
    window.removeTemplate = removeTemplate;

    document.getElementById('templateForm').addEventListener('submit', (event) => {
        event.preventDefault();

        const category = document.getElementById('templateCategory').value;
        const priority = document.getElementById('templatePriority').value;
        const translations = readTranslationsFromModal();

        const requiredOk = ['en', 'hi', 'mr'].every((lang) => {
            const tx = translations[lang];
            return tx && tx.name && tx.title && tx.content;
        });

        if (!requiredOk) {
            showToast(t('requiredAllLang'), 'error');
            return;
        }

        const payload = {
            templateId: editingTemplateId || undefined,
            name: translations.en.name,
            category,
            description: translations.en.description,
            title: translations.en.title,
            content: translations.en.content,
            priority,
            iconKey: getCategoryIcon(category),
            translations
        };

        const isEdit = Boolean(editingTemplateId);
        window.noticeTemplateStore.upsertTemplate(payload);
        closeTemplateModal();
        refreshTemplateView();
        showToast(isEdit ? t('toastUpdated') : t('toastCreated'), 'success');
    });

    document.getElementById('templateModal').addEventListener('click', (event) => {
        if (event.target.id === 'templateModal') {
            closeTemplateModal();
        }
    });

    const publishSelectAll = document.getElementById('templatePublishSelectAll');
    if (publishSelectAll) {
        publishSelectAll.addEventListener('change', togglePublishAllBoards);
    }

    const publishBoardList = document.getElementById('templatePublishBoardsList');
    if (publishBoardList) {
        publishBoardList.addEventListener('change', (event) => {
            if (!event.target || !event.target.classList || !event.target.classList.contains('template-publish-board-checkbox')) return;
            syncPublishBoardStyles();

            const all = Array.from(document.querySelectorAll('.template-publish-board-checkbox'));
            const allChecked = all.length > 0 && all.every((checkbox) => checkbox.checked);
            const selectAll = document.getElementById('templatePublishSelectAll');
            if (selectAll) selectAll.checked = allChecked;
        });
    }

    const showNoticeBoardToggle = document.getElementById('templatePublishShowNoticeBoard');
    if (showNoticeBoardToggle) {
        showNoticeBoardToggle.addEventListener('change', () => {
            const options = document.getElementById('templateNoticeBoardOptions');
            if (options) {
                options.style.display = showNoticeBoardToggle.checked ? 'block' : 'none';
            }
        });
    }

    const recurringToggle = document.getElementById('templatePublishRecurring');
    if (recurringToggle) {
        recurringToggle.addEventListener('change', toggleTemplatePublishRecurring);
    }

    ['templatePublishRecurringStartDate', 'templatePublishRecurringEndDate', 'templatePublishDailyStartTime', 'templatePublishDailyEndTime'].forEach((id) => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', syncTemplatePublishWindowFromRecurring);
        }
    });

    const recurringDaysContainer = document.getElementById('templatePublishRecurringPanel');
    if (recurringDaysContainer) {
        recurringDaysContainer.addEventListener('change', (event) => {
            if (!event.target || event.target.name !== 'templatePublishRecurDays') return;
            syncTemplatePublishWindowFromRecurring();
        });
    }

    document.getElementById('templatePublishForm').addEventListener('submit', async (event) => {
        event.preventDefault();

        if (!publishTemplateId) {
            showToast('Template not selected', 'error');
            return;
        }

        const title = document.getElementById('templatePublishTitle').value.trim();
        const content = document.getElementById('templatePublishContent').value.trim();
        const priority = document.getElementById('templatePublishPriority').value === 'emergency' ? 'emergency' : 'normal';
        const startTimeInput = document.getElementById('templatePublishStartTime').value;
        const endTimeInput = document.getElementById('templatePublishEndTime').value;
        const recurringEnabled = Boolean(
            document.getElementById('templatePublishRecurring')
            && document.getElementById('templatePublishRecurring').checked
        );
        const recurringStartDate = document.getElementById('templatePublishRecurringStartDate').value;
        const recurringEndDate = document.getElementById('templatePublishRecurringEndDate').value;
        const dailyStartTime = document.getElementById('templatePublishDailyStartTime').value;
        const dailyEndTime = document.getElementById('templatePublishDailyEndTime').value;
        const recurringDays = getSelectedTemplateRecurringDays();
        const allBoards = Boolean(document.getElementById('templatePublishSelectAll') && document.getElementById('templatePublishSelectAll').checked);
        const selectedBoards = Array.from(document.querySelectorAll('.template-publish-board-checkbox:checked')).map((checkbox) => checkbox.value);
        const publishAsNoticeBoard = Boolean(
            document.getElementById('templatePublishShowNoticeBoard')
            && document.getElementById('templatePublishShowNoticeBoard').checked
        );
        const imageFileInput = document.getElementById('templatePublishNoticeBoardImage');
        const imageFile = imageFileInput && imageFileInput.files && imageFileInput.files[0] ? imageFileInput.files[0] : null;
        let effectiveStartTime = startTimeInput;
        let effectiveEndTime = endTimeInput;

        if (!title || !content) {
            showToast('Please enter title and content', 'error');
            return;
        }

        if (recurringEnabled) {
            if (!recurringStartDate || !recurringEndDate) {
                showToast('Please select recurring from and to dates', 'error');
                return;
            }

            if (new Date(recurringEndDate) < new Date(recurringStartDate)) {
                showToast('Recurring To Date must be on or after From Date', 'error');
                return;
            }

            if (!dailyStartTime || !dailyEndTime) {
                showToast('Please set daily start and end time for recurring schedule', 'error');
                return;
            }

            if (!recurringDays) {
                showToast('Please select at least one recurring day', 'error');
                return;
            }

            effectiveStartTime = combineLocalDateTime(recurringStartDate, dailyStartTime);
            effectiveEndTime = combineLocalDateTime(recurringEndDate, dailyEndTime);
            document.getElementById('templatePublishStartTime').value = effectiveStartTime;
            document.getElementById('templatePublishEndTime').value = effectiveEndTime;
        }

        if (!effectiveStartTime || !effectiveEndTime) {
            showToast('Please select start and end time', 'error');
            return;
        }

        if (new Date(effectiveEndTime) <= new Date(effectiveStartTime)) {
            showToast('End time must be after start time', 'error');
            return;
        }

        if (!allBoards && selectedBoards.length === 0) {
            showToast('Please select at least one board', 'error');
            return;
        }

        const targetBoards = allBoards ? 'all' : selectedBoards.join('|');
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
        const publishGroupId = publishAsNoticeBoard
            ? `tpl_${Date.now()}_${Math.floor(Math.random() * 100000)}`
            : '';

        try {
            const marqueeResult = await api.post('/notice/create', {
                title,
                content,
                priority,
                startTime: new Date(effectiveStartTime).toISOString(),
                endTime: new Date(effectiveEndTime).toISOString(),
                targetBoards,
                moduleType: 'marquee',
                isRecurring: recurringEnabled,
                dailyStartTime: recurringEnabled ? dailyStartTime : '',
                dailyEndTime: recurringEnabled ? dailyEndTime : '',
                recurringDays: recurringEnabled ? recurringDays : '',
                timezone,
                publishGroupId
            });

            if (!marqueeResult || !marqueeResult.success) {
                showToast((marqueeResult && marqueeResult.error) || 'Failed to publish notice', 'error');
                return;
            }

            if (publishAsNoticeBoard) {
                let uploadedImageUrl = '';
                if (imageFile) {
                    const formData = new FormData();
                    formData.append('file', imageFile);
                    const uploadResult = await api.upload('/media/upload', formData);
                    if (!uploadResult || !uploadResult.success || !uploadResult.media || !uploadResult.media.pathOrUrl) {
                        showToast((uploadResult && uploadResult.error) || 'Marquee published, but notice board image upload failed', 'error');
                        return;
                    }
                    uploadedImageUrl = toAbsoluteMediaUrl(uploadResult.media.pathOrUrl);
                }

                const noticeBoardBarColor = isValidHexColor(selectedNoticeBoardColor)
                    ? selectedNoticeBoardColor
                    : deriveAutoNoticeBoardColor(`${publishTemplateId}|${title}|${priority}`);

                const noticeBoardMediaPayload = {
                    title: `${title} - Notice Board`,
                    content: 'Displaying scheduled media',
                    priority: 'normal',
                    startTime: new Date(effectiveStartTime).toISOString(),
                    endTime: new Date(effectiveEndTime).toISOString(),
                    targetBoards,
                    moduleType: 'media',
                    mediaType: 'notice_board',
                    mediaUrl: `notice-board://template/${publishTemplateId || 'template'}/${Date.now()}`,
                    isRecurring: recurringEnabled,
                    dailyStartTime: recurringEnabled ? dailyStartTime : '',
                    dailyEndTime: recurringEnabled ? dailyEndTime : '',
                    recurringDays: recurringEnabled ? recurringDays : '',
                    timezone,
                    publishGroupId,
                    noticeBoardTitle: title,
                    noticeBoardBody: content,
                    noticeBoardImageUrl: uploadedImageUrl,
                    noticeBoardBarColor,
                    noticeBoardTemplateId: publishTemplateId
                };

                const noticeBoardResult = await api.post('/notice/create', noticeBoardMediaPayload);
                if (!noticeBoardResult || !noticeBoardResult.success) {
                    showToast((noticeBoardResult && noticeBoardResult.error) || 'Marquee published, but notice board publish failed', 'error');
                    return;
                }
            }

            showToast('Template notice published successfully!', 'success');
            closeTemplatePublishModal();
        } catch (error) {
            console.error('Template publish error:', error);
            showToast('Failed to publish notice', 'error');
        }
    });

    document.getElementById('templatePublishModal').addEventListener('click', (event) => {
        if (event.target.id === 'templatePublishModal') {
            closeTemplatePublishModal();
        }
    });

    // Init
    renderNoticeBoardPalette();
    syncLanguageButtons();
    setTemplateModalLanguage(currentLang);
    applyTemplateI18n();
    refreshTemplateView();
})();
