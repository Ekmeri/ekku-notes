# Ekku Notes 📝

Visuaalinen muistiinpanosovellus - digitaalinen ilmoitustaulu muistilapuilla.

## Ominaisuudet

- **Muistilaput** - Drag & drop, resize, 6 väriä
- **Tehtävät** - Lisää tehtäviä lapuille, seuraa edistymistä
- **Muistettavat** - Erilliset muistutukset
- **Piirto** - Piirrä suoraan lapuille (5 väriä, undo)
- **Tehtäväpaneeli** - Kaikki tehtävät yhdessä näkymässä, drag & drop järjestys
- **Ainutlaatuiset laput** - Satunnaiset teipit, kulmat, varjot
- **Automaattinen tallennus** - Eqbit API

## Tech Stack

- React 18 + TypeScript
- Vite
- Redux Toolkit
- react-rnd (drag & resize)
- Eqbit API (tallennus)

## Kehitys

```bash
npm install
npm run dev    # http://localhost:5173
npm run build
```

## Rakenne

```
src/
  App.tsx           # Whiteboard + toolbar
  redux/
    store.ts
    notesSlice.ts   # Note, Task, Reminder, DrawingStroke
  components/
    StickyNote.tsx  # Muistilappu + piirto
    TaskPanel.tsx   # Tehtäväpaneeli
  services/
    eqbitService.ts # API-integraatio
```

## Lisenssi

MIT
