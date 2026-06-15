import type { SpindleBackendContext } from 'lumiverse-spindle-types';

export function setup(ctx: SpindleBackendContext) {
    ctx.messages.on('janny-start', async (data: { uuid: string, cookie: string }) => {
        try {
            // 1. Get the direct Download Link from JannyAI
            const jannyRes = await fetch('https://api.jannyai.com/api/v1/download', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ characterId: data.uuid })
            });

            const jannyData = await jannyRes.json();
            if (jannyData.status !== 'ok') {
                throw new Error(jannyData.error || 'Character hidden or unavailable.');
            }

            // 2. Download the Image Buffer (The actual V2 card)
            const imgRes = await fetch(jannyData.downloadUrl);
            const arrayBuffer = await imgRes.arrayBuffer();

            // 3. Post to the local Lumiverse database API using the user's secure cookie
            const formData = new FormData();
            formData.append('file', new Blob([arrayBuffer], { type: 'image/png' }), `${data.uuid}.png`);

            const importRes = await fetch('http://localhost:7860/api/v1/characters', {
                method: 'POST',
                headers: { 'Cookie': data.cookie },
                body: formData
            });

            if (importRes.ok) {
                // Tell the frontend we succeeded!
                ctx.messages.send('janny-success', {});
            } else {
                throw new Error(`Lumiverse rejected import: ${importRes.status}`);
            }
        } catch (err: any) {
            ctx.messages.send('janny-error', { error: err.message });
        }
    });
}