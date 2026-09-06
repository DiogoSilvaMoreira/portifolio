# Diogo Moreira® — Digital Experiences

Site profissional estático: `index.html` + `styles.css` + `site.js`, com imagens otimizadas em `assets/`.

Identidade editorial premium: tipografia Fraunces (display/serif) + DM Sans (UI/corpo), base ivory/preto/grafite com azul de assinatura (`--sig`).

## Estrutura
- `index.html` — marcação semântica + metadados de SEO/Open Graph + JSON-LD
- `styles.css` — design system (cores, tipografia, grid editorial, animações)
- `site.js` — menu mobile fullscreen, header no scroll, reveal on scroll, hero interativo (cursor + headline stagger) e botões magnéticos
- `assets/` — logo e imagens em WebP/PNG otimizadas

## Como publicar
```bash
git add -A
git commit -m "feat: aplica novo portfólio profissional"
git push origin main
```

## Onde editar rápido
- **WhatsApp**: buscar `5535999675196`
- **Logo**: `assets/logo-diogo.png`
- **Faixa de posicionamento (marquee)**: buscar `marquee-group` no index.html
- **Projetos selecionados**: buscar `class="project"` no index.html
- **Serviços e preços**: buscar `class="service"` no index.html
