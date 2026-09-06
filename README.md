# Roteiro do Quiz — Festa de São Pio X

Gerador estático, mobile-first e sem dependências para montar o roteiro do quiz presencial. Cada rodada reúne seis blocos, permite ocultar respostas ou alternativas e regenerar blocos separadamente.

Para testar localmente:

```powershell
python -m http.server 8765 --bind 127.0.0.1
```

Abra `http://127.0.0.1:8765/`.

O banco `presenter-data.js` é gerado pelos arquivos revisados em `perguntas/` e pelas frases em `questions.js`:

```powershell
node build-presenter-data.js
```
