export interface SoundOption {
    id: string;
    name: string;
    type: 'oscillator' | 'file';
    url?: string;
}

export const BUILTIN_SOUNDS: SoundOption[] = [
    { id: 'bell', name: '🔔 Classic Bell', type: 'oscillator' },
    { id: 'digital', name: '🤖 Digital Beep', type: 'oscillator' },
    { id: 'bird', name: '🐦 Chirp (Simple)', type: 'oscillator' },
];

export const AVAILABLE_SOUNDS: SoundOption[] = (() => {
    // Vite glob import to find all mp3 files in the assets/sounds directory
    // eager: true loads them synchronously so we can use them immediately
    const modules = import.meta.glob('../assets/sounds/*.mp3', { eager: true });

    const customSounds: SoundOption[] = Object.keys(modules).map((path) => {
        // path is relative to this file, e.g., "../assets/sounds/my-sound.mp3"
        const fileName = path.split('/').pop() || 'Unknown';
        // Create a readable name by removing the extension
        const name = fileName.replace(/\.[^/.]+$/, "");

        // In Vite, importing an asset like an mp3 with eager data usually returns
        // a module where the default export is the URL string
        const mod = modules[path] as { default: string };

        return {
            id: `custom-${fileName}`,
            name: `🎵 ${name}`,
            type: 'file',
            url: mod.default
        };
    });

    return [...BUILTIN_SOUNDS, ...customSounds];
})();
