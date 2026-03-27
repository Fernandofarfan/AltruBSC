# 🌟 AltruBSC - Frontend App

Este es el frontend oficial de la plataforma de donaciones descentralizada **AltruBSC**. 
Se trata de una aplicación web moderna, rápida y con un diseño de UI/UX profesional y minimalista.

## 🛠️ Stack Tecnológico

- **React 19** + **TypeScript**
- **Vite 8** (Construcción ultrarrápida y recarga en caliente)
- **Tailwind CSS v4** (Integrado mediante `@tailwindcss/vite` para utilidades de estilo instantáneas)
- **Framer Motion** (Micro-interacciones y animaciones de página suaves)
- **Ethers.js v6** (Conexión RPC y lectura de Smart Contracts)
- **Lucide React** (Iconografía elegante)

## 🎨 Diseño y UI

La interfaz fue reconstruida completamente bajo principios de **Diseño Minimalista / Funcional**:
- Paleta monocromática en tonos `zinc` / `slate`.
- Sombras suaves y efectos de cristal (`backdrop-blur`) en menús de navegación.
- Componentes altamente responsivos para móviles y escritorio.
- Sin configuraciones complejas antiguas (`postcss` / `tailwind.config` eliminados en favor del nuevo motor v4 de Tailwind CSS).

## 🚀 Cómo Iniciar el Frontend Localmente

Asegúrate de que tus Smart Contracts estén desplegados en el backend local de Hardhat y que el servidor de prueba se esté ejecutando en el puerto `:8545`.

1. **Instalar Dependencias**
   ```bash
   npm install
   ```

2. **Iniciar el Servidor de Desarrollo**
   ```bash
   npm run dev
   ```

3. **Abrir en el Navegador**
   Automáticamente se levantará en:
   - `http://localhost:5173` o `http://localhost:5174`

---

## 🔗 Integración con Web3 (MetaMask)

- La app se conecta directamente al RPC predeterminado de Hardhat en `http://127.0.0.1:8545` (Chain ID 31337).
- Se requiere tener instalada la extensión **MetaMask**.
- Los interactuadores de frontend (Donación, Perfil, Causas) leen y escriben en los contratos definidos en `src/contract.ts`.

## 📁 Estructura del Código

- `src/App.tsx`: Punto de entrada principal y renderizado interactivo de la UI.
- `src/contract.ts`: ABIs y direcciones de contratos inyectadas.
- `src/App.css`: Hoja de estilos principal con los keyframes base de framer y la inyección limpia de Tailwind CSS v4.
