import { Injectable, signal } from '@angular/core';

export type Theme = 'dark' | 'light';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly storageKey = 'app_user_theme_mode';
  readonly theme = signal<Theme>('dark');

  constructor() {
    this.initTheme();
  }

  private initTheme(): void {
    const savedTheme = localStorage.getItem(this.storageKey) as Theme | null;
    if (savedTheme === 'light' || savedTheme === 'dark') {
      this.applyThemeToDom(savedTheme);
      this.theme.set(savedTheme);
    } else {
      this.applyThemeToDom('dark');
      this.theme.set('dark');
    }
  }

  toggleTheme(): void {
    const newTheme: Theme = this.theme() === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
  }

  setTheme(newTheme: Theme): void {
    const updateDom = () => {
      this.theme.set(newTheme);
      localStorage.setItem(this.storageKey, newTheme);
      this.applyThemeToDom(newTheme);
    };

    if (typeof document !== 'undefined' && 'startViewTransition' in document) {
      (document as any).startViewTransition(() => {
        updateDom();
      });
    } else {
      updateDom();
    }
  }

  private applyThemeToDom(newTheme: Theme): void {
    const root = document.documentElement;
    if (newTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }
}
