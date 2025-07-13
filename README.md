# Cafe Ordering System

Moderni sistem za poručivanje u kafiću sa QR kodovima, real-time komunikacijom i naprednim admin panelom.

## 🚀 Funkcionalnosti

### Za korisnike:
- **QR kod skeniranje** - Skeniranje QR koda sa stola
- **Digitalni meni** - Pregled menija po kategorijama
- **Korpa** - Dodavanje i uklanjanje stavki
- **Poručivanje** - Jednostavno kreiranje porudžbine

### Za konobare:
- **Real-time obaveštenja** - Trenutna obaveštenja o novim porudžbinama
- **Upravljanje porudžbinama** - Odobravanje i isporučivanje
- **Pregled stolova** - Praćenje aktivnih stolova

### Za admin:
- **Napredne statistike** - Prihod, popularnost proizvoda
- **Pregled svih porudžbina** - Kompletan istorijat
- **Analitika** - Statistike po kategorijama

## 🛠️ Tehnologije

- **Backend**: Node.js, Express.js, Socket.io
- **Frontend**: React.js, React Router
- **Autentifikacija**: JWT tokens
- **Real-time**: Socket.io
- **Styling**: Modern CSS sa CSS varijablama

## 📦 Instalacija

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm start
```

## 🔧 Pokretanje

1. **Pokrenite backend** (port 5000):
```bash
cd backend
npm run dev
```

2. **Pokrenite frontend** (port 3000):
```bash
cd frontend
npm start
```

3. **Otvorite aplikaciju**:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 👥 Test nalozi

### Admin
- **Username**: admin
- **Password**: admin123

### Konobar
- **Username**: konobar1
- **Password**: konobar123

## 📱 Korišćenje

### 1. Testiranje QR kodova
- Idite na: http://localhost:3000/scan
- Unesite QR kod (npr. TABLE_001)
- Otvoriće se meni za taj sto

### 2. Konobarski panel
- Prijavite se kao konobar
- Pratite nove porudžbine u real-time
- Odobravajte i isporučujte porudžbine

### 3. Admin panel
- Prijavite se kao admin
- Pregledajte statistike i sve porudžbine
- Analizirajte prihode po kategorijama

## 🎨 Dizajn

Aplikacija koristi moderni dizajn sa:
- **Inter font** - Čitljiv i moderan
- **CSS varijable** - Konzistentne boje
- **Responsive dizajn** - Radi na svim uređajima
- **Smooth animacije** - Profesionalan izgled
- **Gradient pozadine** - Moderni vizuelni efekti

## 🔄 Real-time funkcionalnosti

- **Socket.io** za trenutne obaveštenja
- **Automatsko osvežavanje** porudžbina
- **Live status** ažuriranja
- **Push notifikacije** za nove porudžbine

## 📊 Statistike

Admin panel prikazuje:
- Ukupan broj porudžbina
- Ukupan prihod
- Prosečnu vrednost porudžbine
- Najpopularnije proizvode
- Prihod po kategorijama

## 🔐 Sigurnost

- **JWT autentifikacija**
- **Zaštita ruta**
- **Validacija podataka**
- **Sigurni API endpoints**

## 🚀 Deployment

Aplikacija je spremna za deployment na:
- **Heroku**
- **Vercel** (frontend)
- **Railway**
- **DigitalOcean**

## 📝 API Endpoints

### Autentifikacija
- `POST /api/login` - Login

### Meni
- `GET /api/menu` - Dobavi meni

### Stolovi
- `GET /api/table/:qrCode` - Informacije o stolu
- `GET /api/tables` - Svi stolovi

### Porudžbine
- `POST /api/orders` - Kreiraj porudžbinu
- `GET /api/orders` - Dobavi porudžbine
- `PUT /api/orders/:id` - Ažuriraj status

## 🎯 Buduće funkcionalnosti

- [ ] Integracija sa pravom kamerom za QR skeniranje
- [ ] Push notifikacije
- [ ] Plaćanje karticom
- [ ] Izveštaji u PDF formatu
- [ ] Multi-language podrška
- [ ] Dark mode
- [ ] Mobile app

---

**Napravljeno sa ❤️ za moderne kafiće** 