export const PROJECT_TYPES = [
  {
    value: "informativa",
    label: "Página informativa",
    shortDescription: "Presencia profesional para presentar tu negocio y generar contactos.",
    price: 120,
    time: "5 a 8 días",
    idealFor: "Profesionales, servicios y pequeños negocios",
    badge: "",
    includes: [
      "Hasta 5 secciones en una sola página",
      "Diseño adaptable a computadora y celular",
      "Botones de contacto, WhatsApp y redes sociales",
      "Formulario de contacto básico",
      "SEO técnico y velocidad inicial",
      "Publicación y 2 rondas de ajustes",
    ],
  },
  {
    value: "catalogo",
    label: "Catálogo digital",
    shortDescription: "Productos o servicios organizados para recibir consultas y pedidos.",
    price: 200,
    time: "8 a 12 días",
    idealFor: "Tiendas, distribuidores y marcas con inventario",
    badge: "Más solicitado",
    includes: [
      "Todo lo incluido en la página informativa",
      "Carga inicial de hasta 20 productos o servicios",
      "Categorías y fichas con imagen, precio y descripción",
      "Búsqueda o filtros básicos",
      "Solicitud de productos mediante WhatsApp",
      "2 rondas de ajustes",
    ],
  },
  {
    value: "tienda",
    label: "Tienda con carrito",
    shortDescription: "Experiencia de compra con carrito y recepción estructurada de pedidos.",
    price: 350,
    time: "12 a 18 días",
    idealFor: "Negocios que quieren vender y organizar pedidos en línea",
    badge: "",
    includes: [
      "Catálogo inicial de hasta 20 productos",
      "Carrito de compras y resumen del pedido",
      "Variantes básicas, cantidades y cálculo de totales",
      "Formulario de compra y confirmación",
      "Envío del pedido por correo o WhatsApp",
      "Configuración básica de entrega",
    ],
  },
  {
    value: "sistema",
    label: "Sistema personalizado",
    shortDescription: "Aplicación web con datos y procesos adaptados a la operación del negocio.",
    price: 500,
    time: "Desde 3 semanas",
    idealFor: "Operaciones que necesitan controlar información y procesos",
    badge: "",
    includes: [
      "Análisis funcional y definición del alcance",
      "Base de datos y módulo administrativo principal",
      "Registro, consulta, edición y control de información",
      "Acceso privado para un rol principal",
      "Diseño responsive",
      "Pruebas, publicación y documentación básica",
    ],
  },
  {
    value: "automatizacion",
    label: "Automatización de procesos",
    shortDescription: "Conecta herramientas y elimina tareas manuales repetitivas.",
    price: 200,
    time: "5 a 10 días",
    idealFor: "Negocios que reciben solicitudes, datos o tareas frecuentes",
    badge: "Nuevo",
    includes: [
      "Diagnóstico de un proceso repetitivo",
      "Un flujo automatizado principal",
      "Conexión de hasta 2 aplicaciones o servicios",
      "Notificación automática por correo",
      "Registro básico de ejecuciones y errores",
      "Pruebas, entrega y guía de uso",
    ],
  },
] as const;

export const PROJECT_EXTRAS = [
  { value: "panel", label: "Panel administrativo", price: 120 },
  { value: "reservas", label: "Reservas o citas", price: 80 },
  { value: "pagos", label: "Pagos en línea", price: 100 },
  { value: "usuarios", label: "Usuarios y roles adicionales", price: 90 },
  { value: "blog", label: "Blog o noticias", price: 60 },
  { value: "idioma", label: "Idioma adicional", price: 50 },
  { value: "api", label: "Integración con API", price: 100 },
  { value: "notificaciones", label: "Notificaciones automáticas", price: 60 },
  { value: "whatsapp", label: "Integración avanzada con WhatsApp", price: 120 },
  { value: "ia", label: "Flujo asistido por inteligencia artificial", price: 180 },
] as const;

export const PRICING_NOTES = [
  "Los precios son referencias iniciales y se confirman al definir el alcance.",
  "Dominio, hosting, pasarelas de pago y suscripciones externas se cotizan aparte.",
  "La propuesta final especifica entregables, límites, tiempos y soporte.",
] as const;

export function calculateQuote(typeValue: string, requestedExtras: string[]) {
  const type = PROJECT_TYPES.find((item) => item.value === typeValue);
  if (!type) return null;
  const uniqueExtras = [...new Set(requestedExtras)].slice(0, PROJECT_EXTRAS.length);
  const extras = uniqueExtras
    .map((value) => PROJECT_EXTRAS.find((item) => item.value === value))
    .filter((item): item is (typeof PROJECT_EXTRAS)[number] => Boolean(item));
  return {
    type,
    extras,
    total: type.price + extras.reduce((sum, item) => sum + item.price, 0),
  };
}
