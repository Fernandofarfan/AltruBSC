# 🎉 AltruBSC - GUÍA COMPLETA DE HERRAMIENTAS

## ✅ ESTADO DEL PROYECTO

**Todos los smart contracts están 100% funcionales y operacionales. El Frontend ha sido rediseñado a un estándar Profesional/Premium usando Tailwind CSS v4.**

---

## 🚀 INICIAR EL ECOSISTEMA COMPLETAMENTE

Asegúrate de ejecutar los siguientes comandos en diferentes terminales:

### 1. Iniciar la Blockchain (Terminal 1)
```bash
cd smart-contracts
npx hardhat node
```
*(Si la terminal se cierra o reinicias la PC, Hardhat se "vacía". Debes volver a hacer los Pasos 2 y 3).*

### 2. Desplegar Contratos en la Blockchain (Terminal 2)
```bash
cd smart-contracts
node scripts/deploy.js
```

### 3. Crear las Causas Iniciales / Setup (Terminal 2)
```bash
cd smart-contracts
node scripts/setup.js
```

### 4. Levantar el Frontend Moderno (Terminal 3)
```bash
cd frontend
npm run dev
```

Luego visita en de tu navegador: 
👉 **http://localhost:5173** o **http://localhost:5174**

---

### Opción 2: Solo Backend (Para Testing Rápido)

```bash
# Terminal 1 - Blockchain
cd smart-contracts
npx hardhat node

# Terminal 2 - Usar CLI
cd smart-contracts
node scripts/cli.js status
```

---

## 📋 HERRAMIENTAS DISPONIBLES

### 1. **CLI utility** - Interfaz de línea de comandos

```bash
cd smart-contracts

# Ver todas las causas
node scripts/cli.js causes

# Ver perfil de donante
node scripts/cli.js donor [address]

# Ver actualizaciones de causa
node scripts/cli.js updates [cause-id]

# Ver estado general
node scripts/cli.js status
```

**Ejemplo:**
```bash
node scripts/cli.js causes
node scripts/cli.js donor 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
node scripts/cli.js updates 1
```

---

### 2. **Deploy Script** - Desplegar contratos

```bash
cd smart-contracts
npm exec hardhat run scripts/deploy.js
```

**Output:**
- Despliega DonationPlatform
- Despliega MockERC20 (USDT)
- Despliega AltruRewardNFT
- Proporciona direcciones para actualizar en frontend

---

### 3. **Setup Script** - Inicializar plataforma

```bash
cd smart-contracts
npm exec hardhat run scripts/setup.js
```

**Lo que hace:**
- Registra NGO
- Vincula sistema NFT
- Crea 5 causas de donación
- Configura parámetros iniciales

---

### 4. **Frontend Web App** - Interfaz visual

```bash
cd frontend
npm run dev
```

**Abre en navegador:** http://localhost:5174

**Características:**
- ✅ Conectar cartera (MetaMask)
- ✅ Ver causas disponibles
- ✅ Donar BNB o USDT
- ✅ Ver progreso de causas
- ✅ Rastreo de donaciones
- ✅ Sistema de recompensas NFT
- ✅ Generar certificados
- ✅ Leaderboard de donantes
- ✅ Modo oscuro/claro
- ✅ Español e inglés

---

## 🧪 TESTING

### Tests Completos
```bash
cd smart-contracts
npm exec hardhat run scripts/verify.js
```

### Health Check Rápido
```bash
cd smart-contracts
npm exec hardhat run scripts/health-check.js
```

---

## 📊 CONTRATOS INTELIGENTES

### DonationPlatform.sol
**Dirección:** 0x5FbDB2315678afecb367f032d93F642f64180aa3

**Funciones Disponibles:**

| Función | Tipo | Descripción |
|---------|------|-------------|
| `donateToCause(causeId)` | payable | Donar BNB a una causa |
| `donateTokenToCause(causeId, token, amount)` | - | Donar tokens ERC20 |
| `withdraw(causeId, token)` | - | Retirar fondos (NGO) |
| `addCauseUpdate(causeId, text)` | - | Agregar actualización |
| `getCauseUpdates(causeId)` | view | Ver actualizaciones |
| `causes(id)` | view | Info de causa |
| `donors(address)` | view | Info de donante |
| `causeBalances(id, token)` | view | Saldo de causa |
| `userContributions(user, cause, token)` | view | Contrib. del usuario |

### MockERC20.sol
**Dirección:** 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512

**Funciones:**
- `mint(address, amount)` - Crear tokens (para testing)
- `approve(spender, amount)` - Permitir gastos
- `transfer(to, amount)` - Enviar tokens
- `transferFrom(from, to, amount)` - Transferencia autorizada

### AltruRewardNFT.sol
**Dirección:** 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0

**Funciones:**
- `mintReward(to, uri)` - Crear NFT de recompensa
- Standard ERC721 completo

---

## 🔐 DATOS DE TESTING

### Cuenta de Test (Hardhat - NUNCA usar en mainnet)
```
Dirección: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
Balance: 10,000 ETH
```

**⚠️ ADVERTENCIA:** Estas claves son públicas. Solo usar en Hardhat local.

---

## 💰 CAUSAS DE DONACIÓN

| ID | Nombre | Meta | Token |
|----|--------|------|-------|
| 1 | Clean Water Initiative | 5 | BNB |
| 2 | Education for All | 10,000 | USDT |
| 3 | Healthcare Crisis Response | 10 | BNB |
| 4 | Climate Action Program | 50,000 | USDT |
| 5 | Food Security Project | 3 | BNB |

---

## 🎁 SISTEMA DE RECOMPENSAS

- **Umbral:** 0.5 BNB donados
- **Recompensa:** NFT "Altru Impact Badge"
- **Accionamiento:** Automático al alcanzar umbral
- **Transferible:** Sí, es un NFT ERC721

---

## 🔍 ENDPOINTS API IMPORTANTES

```
RPC Local: http://127.0.0.1:8545
Frontend: http://localhost:5174
ChainID: 31337
```

---

## ⚡ SOLUCIÓN DE PROBLEMAS

### P: Me da error "No suitable validator found"
R: Reinicia el nodo Hardhat (`npm exec hardhat node`)

### P: Las transacciones son lentas
R: Eso es normal. Hardhat automining puede ser lento. Espera un poco.

### P: No hpuedo conectar con MetaMask
R: Verifica:
- [ ] Hardhat node está corriendo (127.0.0.1:8545)
- [ ] Agregaste red a MetaMask
- [ ] Chain ID es 31337
- [ ] Refeja el navegador

### P: No hay suficientes fondos
R: Usa el faucet en la UI o importa una de las 20 cuentas de test

---

## 📚 ARCHIVOS IMPORTANTES

```
smart-contracts/
  ├── contracts/
  │   ├── DonationPlatform.sol  ✅ Principal
  │   ├── MockERC20.sol         ✅ Token USDT
  │   └── AltruRewardNFT.sol    ✅ NFT Sistema
  └── scripts/
      ├── deploy.js             🚀 Deploy
      ├── setup.js              ⚙️  Inicializar
      ├── cli.js                📋 Utilidad CLI
      └── verify.js             🧪 Tests

frontend/
  ├── src/
  │   ├── App.tsx               💻 App principal
  │   ├── contract.ts           🔗 Direcciones
  │   ├── AIAssistant.tsx       🤖 IA Chat
  │   └── ...otros componentes
  └── index.html
```

---

## ✅ CHECKLIST DE FUNCIONALIDAD

- ✅ Conectar billetera
- ✅ Ver causas
- ✅ Donar BNB
- ✅ Donar USDT
- ✅ Rastrear donaciones
- ✅ Ver progreso
- ✅ Actualizar estado
- ✅ Retirar fondos
- ✅ Obtener NFT
- ✅ Generar certificado
- ✅ Ver leaderboard
- ✅ Modo oscuro
- ✅ Idioma español
- ✅ Chat IA

**Status:** 🟢 TODOS OPERACIONALES

---

## 🎯 PRÓXIMOS PASOS

1. **Testing Testnet:** Desplegar en Mumbai/BSC testnet
2. **Auditoría:** Código auditado por profesionales
3. **Mainnet:** Desplegar en red principal
4. **Frontend:** Mejorar UI/UX
5. **Marketing:** Promocionar campaña de donaciones

---

**¡Tu plataforma de donaciones está lista para cambiar el mundo! 🌍💚**
