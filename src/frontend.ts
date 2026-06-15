import type { SpindleFrontendContext } from 'lumiverse-spindle-types';

export function setup(ctx: SpindleFrontendContext) {
    // 1. Create a floating button
    const btn = document.createElement('button');
    btn.innerText = '🌌 J-Hub Import';
    btn.style.cssText = 'position: fixed; bottom: 20px; left: 20px; z-index: 9999; background: #6b21a8; color: white; border: 2px solid #a855f7; padding: 12px 24px; border-radius: 12px; font-weight: bold; cursor: pointer; box-shadow: 0px 4px 10px rgba(0,0,0,0.5);';
    document.body.appendChild(btn);

    // 2. Create the Modal UI
    const modal = document.createElement('div');
    modal.style.cssText = 'display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 400px; background: #18181b; border: 2px solid #a855f7; border-radius: 12px; z-index: 10000; padding: 20px; color: white; box-shadow: 0 10px 30px rgba(0,0,0,0.8);';
    
    modal.innerHTML = `
        <h2 style="margin-top:0; color: #d8b4fe;">🌌 JannyAI Importer</h2>
        <p style="font-size: 14px; color: #a1a1aa; margin-bottom: 15px;">Paste a JanitorAI or JannyAI character URL below to pull it instantly.</p>
        <input type="text" id="janny-url-input" placeholder="https://janitorai.com/characters/..." style="width: 100%; padding: 10px; margin-bottom: 15px; border-radius: 6px; border: 1px solid #3f3f46; background: #27272a; color: white; box-sizing: border-box;" />
        <button id="janny-import-btn" style="width: 100%; background: #a855f7; color: white; border: none; padding: 10px; border-radius: 6px; cursor: pointer; font-weight: bold;">Import Character</button>
        <div id="janny-status" style="margin-top: 15px; font-size: 14px; text-align: center; height: 20px;"></div>
        <button id="janny-close-btn" style="position: absolute; top: 10px; right: 15px; background: transparent; border: none; color: white; cursor: pointer; font-size: 16px;">✖</button>
    `;
    document.body.appendChild(modal);

    // 3. UI Interactions
    btn.onclick = () => modal.style.display = 'block';
    document.getElementById('janny-close-btn')!.onclick = () => {
        modal.style.display = 'none';
        document.getElementById('janny-status')!.innerText = '';
    };

    // 4. Handle Communication with your Backend process
    const statusEl = document.getElementById('janny-status')!;
    
    ctx.messages.on('janny-success', () => {
        statusEl.innerText = '✅ Successfully imported to Lumiverse!';
        statusEl.style.color = '#4ade80';
        setTimeout(() => modal.style.display = 'none', 3000);
    });

    ctx.messages.on('janny-error', (data: any) => {
        statusEl.innerText = '❌ ' + (data.error || 'Failed to import');
        statusEl.style.color = '#f87171';
    });

    document.getElementById('janny-import-btn')!.onclick = () => {
        const urlInput = (document.getElementById('janny-url-input') as HTMLInputElement).value;
        const uuidMatch = urlInput.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
        
        if (!uuidMatch) {
            statusEl.innerText = '❌ Invalid URL. No character ID found.';
            statusEl.style.color = '#f87171';
            return;
        }

        statusEl.innerText = '⏳ Downloading & Importing...';
        statusEl.style.color = '#d8b4fe';

        // Send message to the backend to bypass browser CORS blocks
        ctx.messages.send('janny-start', { 
            uuid: uuidMatch[1],
            cookie: document.cookie // Pass session token to backend to allow import
        });
    };

    // 5. Cleanup when extension is disabled
    return () => {
        btn.remove();
        modal.remove();
    };
}