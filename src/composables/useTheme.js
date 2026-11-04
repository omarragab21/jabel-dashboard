import { ref, watch, onMounted } from 'vue';

const isDark = ref(localStorage.getItem('theme') === 'dark');

export function useTheme() {
    const applyTheme = () => {
        if (isDark.value) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    const toggleTheme = () => {
        isDark.value = !isDark.value;
    };

    watch(isDark, (val) => {
        localStorage.setItem('theme', val ? 'dark' : 'light');
        applyTheme();
    }, { immediate: true });

    const initTheme = () => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            isDark.value = savedTheme === 'dark';
        } else {
            isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        // The watch with immediate: true will handle applying the theme
        // based on the updated isDark.value, so applyTheme() here is redundant
        // if initTheme is called after the watch is set up.
        // However, if initTheme is called before the watch is fully active,
        // or if it's meant to explicitly force an update, it could be kept.
        // Following the provided example, it's kept.
        applyTheme();
    };

    return {
        isDark,
        toggleTheme,
        initTheme
    };
}
