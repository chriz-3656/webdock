async function init() {
  const sidebarSections = document.getElementById('sidebar-sections')!;
  const activeTitle = document.getElementById('active-title')!;
  const tabbar = document.getElementById('tabbar')!;
  const statusbar = document.getElementById('statusbar')!;
  const resizer = document.getElementById('resizer')!;
  const sidebar = document.getElementById('sidebar')!;
  
  const builtInServices = await (window as any).api.getBuiltInServices();
  const customServices = await (window as any).api.getCustomServices();
  
  const allServices = [...builtInServices, ...customServices];
  
  let activeId: string | null = null;
  const items = new Map<string, HTMLElement>();
  const openTabs = new Map<string, { service: any, tabEl: HTMLElement }>();
  
  let sidebarWidth = 250;
  
  // Settings Logic
  const settingsModal = document.getElementById('settings-modal')!;
  const aboutModal = document.getElementById('about-modal')!;
  const themeSelect = document.getElementById('theme-select') as HTMLSelectElement;
  const customName = document.getElementById('custom-name') as HTMLInputElement;
  const customUrl = document.getElementById('custom-url') as HTMLInputElement;
  const customCategory = document.getElementById('custom-category') as HTMLInputElement;
  const customList = document.getElementById('custom-apps-list') as HTMLDivElement;

  function openSettings() {
    (window as any).api.toggleSettingsView(true);
    settingsModal.style.display = 'flex';
    renderCustomApps();
  }

  function closeSettings() {
    settingsModal.style.display = 'none';
    (window as any).api.toggleSettingsView(false);
  }
  
  function openAbout() {
    (window as any).api.toggleSettingsView(true);
    aboutModal.style.display = 'flex';
    (window as any).api.getSystemInfo().then((info: any) => {
      document.getElementById('electron-version-about')!.textContent = info.electronVersion;
    });
  }
  
  function closeAbout() {
    aboutModal.style.display = 'none';
    (window as any).api.toggleSettingsView(false);
  }

  document.getElementById('close-settings-btn')!.addEventListener('click', closeSettings);
  document.getElementById('close-about-btn')!.addEventListener('click', closeAbout);
  document.getElementById('settings-btn')!.addEventListener('click', openSettings);
  document.getElementById('about-btn')!.addEventListener('click', openAbout);

  async function renderCustomApps() {
    customList.innerHTML = '';
    const apps = await (window as any).api.getCustomServices();
    
    apps.forEach((app: any) => {
      const item = document.createElement('div');
      item.style.display = 'flex';
      item.style.justifyContent = 'space-between';
      item.style.alignItems = 'center';
      item.style.padding = '8px 12px';
      item.style.background = 'var(--bg-color)';
      item.style.border = '1px solid var(--border-color)';
      item.style.borderRadius = '6px';
      
      const info = document.createElement('div');
      info.innerHTML = `<strong>${app.name}</strong> <span style="color: var(--text-muted); font-size: 0.9em;">(${app.url})</span>`;
      
      const delBtn = document.createElement('button');
      delBtn.className = 'btn';
      delBtn.textContent = 'Remove';
      delBtn.style.color = '#EF4444';
      delBtn.style.border = 'none';
      
      delBtn.onclick = async () => {
        const newApps = apps.filter((a: any) => a.id !== app.id);
        await (window as any).api.saveCustomServices(newApps);
        
        // Remove from allServices and re-render sidebar
        const index = allServices.findIndex((a: any) => a.id === app.id);
        if (index > -1) {
          allServices.splice(index, 1);
          renderSidebar();
        }
        renderCustomApps();
      };
      
      item.appendChild(info);
      item.appendChild(delBtn);
      customList.appendChild(item);
    });
  }

  document.getElementById('add-custom-btn')!.addEventListener('click', async () => {
    if (customName.value && customUrl.value) {
      const newApp = {
        id: 'custom-' + Date.now(),
        name: customName.value,
        url: customUrl.value,
        icon: 'fas fa-link',
        category: customCategory.value || 'Custom'
      };
      await (window as any).api.saveCustomService(newApp);
      allServices.push(newApp);
      renderSidebar();
      
      customName.value = '';
      customUrl.value = '';
      customCategory.value = '';
      renderCustomApps();
    }
  });

  themeSelect.addEventListener('change', async (e) => {
    const target = e.target as HTMLSelectElement;
    document.documentElement.setAttribute('data-theme', target.value);
    await (window as any).api.saveSettings({ theme: target.value });
  });

  // Sidebar Resizing
  let isResizing = false;
  resizer.addEventListener('mousedown', () => { isResizing = true; });
  document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;
    sidebarWidth = Math.max(150, Math.min(e.clientX, 600));
    sidebar.style.width = `${sidebarWidth}px`;
    (window as any).api.updateLayout(sidebarWidth);
  });
  document.addEventListener('mouseup', () => { isResizing = false; });

  function renderSidebar() {
    sidebarSections.innerHTML = '';
    
    // Group by category
    const groups: Record<string, any[]> = {};
    allServices.forEach(s => {
      const cat = s.category || 'Other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(s);
    });

    for (const cat in groups) {
      const header = document.createElement('div');
      header.className = 'category-header';
      header.textContent = cat;
      sidebarSections.appendChild(header);

      groups[cat].forEach(service => {
        const item = createServiceItem(service);
        items.set(service.id, item);
        sidebarSections.appendChild(item);
      });
    }
  }

  function createServiceItem(service: any) {
    const div = document.createElement('div');
    div.className = 'service-item';
    div.dataset.id = service.id;
    
    const icon = document.createElement('img');
    icon.className = 'service-icon';
    icon.src = `https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(service.url)}`;
    icon.style.objectFit = 'contain';
    icon.style.borderRadius = '4px';
    
    icon.onerror = () => {
      const fallback = document.createElement('div');
      fallback.className = 'service-icon';
      fallback.textContent = service.name.charAt(0);
      fallback.style.display = 'flex';
      fallback.style.alignItems = 'center';
      fallback.style.justifyContent = 'center';
      fallback.style.background = 'var(--bg-color)';
      fallback.style.borderRadius = '4px';
      div.replaceChild(fallback, icon);
    };
    
    const text = document.createElement('div');
    text.textContent = service.name;
    
    div.appendChild(icon);
    div.appendChild(text);
    
    div.addEventListener('click', () => {
      openAppTab(service);
    });
    
    return div;
  }

  function openAppTab(service: any) {
    if (!openTabs.has(service.id)) {
      // Create Tab element
      const tab = document.createElement('div');
      tab.className = 'tab';
      
      const title = document.createElement('div');
      title.className = 'tab-title';
      title.textContent = service.name;
      
      const closeBtn = document.createElement('button');
      closeBtn.className = 'tab-close';
      closeBtn.textContent = 'x';
      closeBtn.onclick = (e) => {
        e.stopPropagation();
        closeAppTab(service.id);
      };
      
      tab.appendChild(title);
      tab.appendChild(closeBtn);
      
      tab.onclick = () => switchToTab(service.id);
      
      tabbar.appendChild(tab);
      openTabs.set(service.id, { service, tabEl: tab });
      
      (window as any).api.openTab(service.url, service.id);
    }
    
    switchToTab(service.id);
  }

  function switchToTab(id: string) {
    if (activeId) {
      const prev = items.get(activeId);
      if (prev) prev.classList.remove('active');
      const prevTab = openTabs.get(activeId);
      if (prevTab) prevTab.tabEl.classList.remove('active');
    }
    
    activeId = id;
    
    // Hide splash screen since a tab is active
    document.getElementById('webview-container')!.style.display = 'none';
    
    const curr = items.get(id);
    if (curr) curr.classList.add('active');
    
    const currTab = openTabs.get(id);
    if (currTab) {
      currTab.tabEl.classList.add('active');
      activeTitle.textContent = currTab.service.name;
    }
    
    (window as any).api.switchTab(id);
  }

  function closeAppTab(id: string) {
    const tab = openTabs.get(id);
    if (tab) {
      tabbar.removeChild(tab.tabEl);
      openTabs.delete(id);
      (window as any).api.closeTab(id);
      
      if (activeId === id) {
        // Switch to the last open tab
        const remaining = Array.from(openTabs.keys());
        if (remaining.length > 0) {
          switchToTab(remaining[remaining.length - 1]);
        } else {
          activeId = null;
          activeTitle.textContent = 'WebDock Dashboard';
          
          // Show splash screen again
          document.getElementById('webview-container')!.style.display = 'flex';
        }
      }
    }
  }

  renderSidebar();
  
  // Search filtering
  document.getElementById('search-input')!.addEventListener('input', (e) => {
    const term = (e.target as HTMLInputElement).value.toLowerCase();
    items.forEach((item, id) => {
      const service = allServices.find(s => s.id === id);
      if (service && service.name.toLowerCase().includes(term)) {
        item.style.display = 'flex';
      } else {
        item.style.display = 'none';
      }
    });
  });
  
  // Set theme from settings
  const settings = await (window as any).api.getSettings();
  document.documentElement.setAttribute('data-theme', settings.theme || 'dark');
  
  // Window controls
  document.getElementById('min-btn')!.addEventListener('click', () => (window as any).api.minimize());
  document.getElementById('max-btn')!.addEventListener('click', () => (window as any).api.maximize());
  document.getElementById('close-btn')!.addEventListener('click', () => (window as any).api.close());

  // Listen for title updates
  (window as any).api.onUpdateTitle((id: string, title: string) => {
    const tab = openTabs.get(id);
    if (tab) {
      tab.tabEl.querySelector('.tab-title')!.textContent = title;
    }
    if (activeId === id) {
      activeTitle.textContent = title;
    }
  });

  // Listen for status updates
  (window as any).api.onUpdateStatus((status: string) => {
    statusbar.textContent = status || 'Ready';
  });
  
  // Sidebar actions
  document.getElementById('downloads-btn')!.addEventListener('click', () => {
    alert('Downloads functionality would be implemented here.');
  });
  document.getElementById('shortcuts-btn')!.addEventListener('click', () => {
    alert('Keyboard Shortcuts: \nCtrl+T: New Tab\nCtrl+W: Close Tab\n(More coming soon)');
  });
  let updateReady = false;
  document.getElementById('updates-btn')!.addEventListener('click', () => {
    if (updateReady) {
      (window as any).api.restartApp();
    } else {
      alert('Checking for updates... You will be notified automatically if an update is found in the background.');
    }
  });

  // Shortcuts & Updates IPC
  (window as any).api.onShortcutNewTab(() => {
    document.getElementById('settings-btn')!.click();
  });
  
  (window as any).api.onShortcutCloseTab(() => {
    if (activeId) closeAppTab(activeId);
  });

  (window as any).api.onUpdateAvailable(() => {
    const btn = document.getElementById('updates-btn')!;
    btn.innerHTML = '⟳ Downloading Update...';
    btn.style.color = 'var(--accent-color)';
  });
  
  (window as any).api.onUpdateDownloaded(() => {
    updateReady = true;
    const btn = document.getElementById('updates-btn')!;
    btn.innerHTML = '🚀 Install Update';
    btn.style.color = '#10B981';
  });
  document.getElementById('dev-tab-btn')!.addEventListener('click', () => {
    const devService = {
      id: 'dev-github',
      name: 'Developer Profile',
      url: 'https://github.com/chriz-3656'
    };
    if (!allServices.find(s => s.id === 'dev-github')) {
      allServices.push(devService);
    }
    openAppTab(devService);
  });
  
  // Navigation controls
  document.getElementById('back-btn')!.addEventListener('click', () => {
    if (activeId) (window as any).api.goBack(activeId);
  });
  document.getElementById('forward-btn')!.addEventListener('click', () => {
    if (activeId) (window as any).api.goForward(activeId);
  });
  document.getElementById('reload-btn')!.addEventListener('click', () => {
    if (activeId) (window as any).api.reload(activeId);
  });
  
  document.getElementById('home-btn')!.addEventListener('click', () => {
    if (activeId) {
      const url = allServices.find(s => s.id === activeId)?.url;
      if (url) {
        (window as any).api.loadUrl(activeId, url);
      }
    }
  });
  document.getElementById('open-browser-btn')!.addEventListener('click', () => {
    if (activeId) (window as any).api.openInBrowser(activeId);
  });
  
  // App starts on dashboard by default
}

init();
