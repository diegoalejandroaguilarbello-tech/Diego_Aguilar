from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    KeepTogether,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output" / "pdf" / "Catalogo_de_servicios_y_precios_Diego_Aguilar.pdf"
OUTPUT.parent.mkdir(parents=True, exist_ok=True)

pdfmetrics.registerFont(TTFont("DejaVu", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"))
pdfmetrics.registerFont(TTFont("DejaVu-Bold", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"))

NAVY = colors.HexColor("#071B38")
BLUE = colors.HexColor("#1769E0")
ICE = colors.HexColor("#EAF3FF")
PALE = colors.HexColor("#F5F8FC")
INK = colors.HexColor("#10213A")
MUTED = colors.HexColor("#5C6B7E")
LINE = colors.HexColor("#DCE6F3")
GREEN = colors.HexColor("#19A974")
WHITE = colors.white

SERVICES = [
    {
        "name": "Página informativa",
        "price": "USD 120",
        "time": "5 a 8 días",
        "ideal": "Profesionales, servicios y pequeños negocios.",
        "summary": "Presencia profesional para explicar qué haces, generar confianza y facilitar el contacto.",
        "items": [
            "Hasta 5 secciones en una sola página.",
            "Diseño adaptable a computadora, tablet y celular.",
            "Presentación del negocio, servicios y propuesta de valor.",
            "Botones de WhatsApp, teléfono, correo y redes sociales.",
            "Formulario de contacto básico.",
            "SEO técnico y optimización inicial de velocidad.",
            "Publicación y 2 rondas de ajustes.",
        ],
        "not_included": "No incluye catálogo, carrito, panel administrativo, dominio, hosting ni servicios externos.",
    },
    {
        "name": "Catálogo digital",
        "price": "USD 200",
        "time": "8 a 12 días",
        "ideal": "Tiendas, distribuidores y marcas con productos o servicios.",
        "summary": "Catálogo organizado para mostrar la oferta y recibir consultas o pedidos por WhatsApp.",
        "items": [
            "Todo lo incluido en la página informativa.",
            "Carga inicial de hasta 20 productos o servicios.",
            "Categorías y fichas con imagen, precio y descripción.",
            "Búsqueda o filtros básicos.",
            "Solicitud de productos mediante WhatsApp.",
            "Diseño adaptable y 2 rondas de ajustes.",
        ],
        "not_included": "La autogestión de productos requiere panel administrativo. No incluye carrito ni pagos en línea.",
    },
    {
        "name": "Tienda con carrito",
        "price": "USD 350",
        "time": "12 a 18 días",
        "ideal": "Negocios que quieren vender y organizar pedidos en línea.",
        "summary": "Experiencia de compra con catálogo, carrito y recepción estructurada de pedidos.",
        "items": [
            "Catálogo inicial de hasta 20 productos.",
            "Carrito de compras y resumen del pedido.",
            "Variantes básicas, cantidades y cálculo de totales.",
            "Formulario de compra y confirmación.",
            "Envío del pedido por correo o WhatsApp.",
            "Configuración básica de entrega.",
        ],
        "not_included": "La pasarela de pago, facturación, inventario avanzado y suscripciones externas se cotizan aparte.",
    },
    {
        "name": "Sistema personalizado",
        "price": "USD 500",
        "time": "Desde 3 semanas",
        "ideal": "Operaciones que necesitan controlar información y procesos.",
        "summary": "Aplicación web con base de datos y módulos adaptados a la operación del negocio.",
        "items": [
            "Análisis funcional y definición documentada del alcance.",
            "Base de datos y módulo administrativo principal.",
            "Registro, consulta, edición y control de información.",
            "Acceso privado para un rol principal.",
            "Diseño responsive y validación de formularios.",
            "Pruebas, publicación y documentación básica.",
        ],
        "not_included": "Múltiples roles, reportes avanzados, integraciones y módulos adicionales se cotizan según complejidad.",
    },
    {
        "name": "Automatización de procesos",
        "price": "USD 200",
        "time": "5 a 10 días",
        "ideal": "Negocios con solicitudes, datos o tareas manuales frecuentes.",
        "summary": "Conexión de herramientas para reducir tareas repetitivas y mejorar el seguimiento.",
        "items": [
            "Diagnóstico de un proceso repetitivo.",
            "Un flujo automatizado principal.",
            "Conexión de hasta 2 aplicaciones o servicios.",
            "Notificación automática por correo.",
            "Registro básico de ejecuciones y errores.",
            "Pruebas, entrega y guía de uso.",
        ],
        "not_included": "Créditos de IA, WhatsApp API, Make, n8n, hosting u otras suscripciones se pagan por separado.",
    },
]

EXTRAS = [
    ("Panel administrativo", "USD 120"),
    ("Reservas o citas", "USD 80"),
    ("Pagos en línea", "USD 100"),
    ("Usuarios y roles adicionales", "USD 90"),
    ("Blog o noticias", "USD 60"),
    ("Idioma adicional", "USD 50"),
    ("Integración con API", "USD 100"),
    ("Notificaciones automáticas", "USD 60"),
    ("Integración avanzada con WhatsApp", "USD 120"),
    ("Flujo asistido por inteligencia artificial", "USD 180"),
]

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="CoverKicker", fontName="DejaVu-Bold", fontSize=10, leading=13, textColor=colors.HexColor("#78AAFF"), spaceAfter=8, uppercase=True))
styles.add(ParagraphStyle(name="CoverTitle", fontName="DejaVu-Bold", fontSize=31, leading=35, textColor=WHITE, spaceAfter=14))
styles.add(ParagraphStyle(name="CoverText", fontName="DejaVu", fontSize=12, leading=19, textColor=colors.HexColor("#CBD9EA"), spaceAfter=12))
styles.add(ParagraphStyle(name="SectionKicker", fontName="DejaVu-Bold", fontSize=9, leading=12, textColor=BLUE, spaceAfter=7))
styles.add(ParagraphStyle(name="H1Custom", fontName="DejaVu-Bold", fontSize=24, leading=29, textColor=NAVY, spaceAfter=10))
styles.add(ParagraphStyle(name="H2Custom", fontName="DejaVu-Bold", fontSize=17, leading=21, textColor=NAVY, spaceAfter=8))
styles.add(ParagraphStyle(name="BodyCustom", fontName="DejaVu", fontSize=9.5, leading=15, textColor=MUTED, spaceAfter=8))
styles.add(ParagraphStyle(name="BodyStrong", fontName="DejaVu-Bold", fontSize=9.5, leading=15, textColor=INK, spaceAfter=5))
styles.add(ParagraphStyle(name="Price", fontName="DejaVu-Bold", fontSize=22, leading=26, textColor=BLUE, alignment=TA_LEFT))
styles.add(ParagraphStyle(name="Small", fontName="DejaVu", fontSize=8, leading=12, textColor=MUTED))
styles.add(ParagraphStyle(name="Footer", fontName="DejaVu", fontSize=7.5, leading=10, textColor=colors.HexColor("#7890AA"), alignment=TA_CENTER))


def p(text, style="BodyCustom"):
    return Paragraph(text, styles[style])


def header_footer(canvas, doc):
    canvas.saveState()
    if doc.page == 1:
        canvas.setFillColor(NAVY)
        canvas.rect(0, 0, A4[0], A4[1], stroke=0, fill=1)
        canvas.setFillColor(colors.HexColor("#0D2D55"))
        canvas.circle(184 * mm, 242 * mm, 48 * mm, stroke=0, fill=1)
        canvas.setFillColor(colors.HexColor("#123866"))
        canvas.circle(187 * mm, 244 * mm, 30 * mm, stroke=0, fill=1)
    else:
        canvas.setStrokeColor(LINE)
        canvas.line(18 * mm, 280 * mm, 192 * mm, 280 * mm)
        canvas.setFont("DejaVu-Bold", 8)
        canvas.setFillColor(NAVY)
        canvas.drawString(18 * mm, 284 * mm, "DIEGO AGUILAR · DESARROLLO WEB")
        canvas.setFont("DejaVu", 7.5)
        canvas.setFillColor(MUTED)
        canvas.drawRightString(192 * mm, 284 * mm, "Servicios y precios · 2026")
        canvas.setStrokeColor(LINE)
        canvas.line(18 * mm, 15 * mm, 192 * mm, 15 * mm)
        canvas.setFont("DejaVu", 7.5)
        canvas.setFillColor(MUTED)
        canvas.drawString(18 * mm, 9 * mm, "@diegoaguilarweb · diegoalejandroaguilarbello@gmail.com")
        canvas.drawRightString(192 * mm, 9 * mm, f"Página {doc.page}")
    canvas.restoreState()


doc = BaseDocTemplate(
    str(OUTPUT),
    pagesize=A4,
    leftMargin=18 * mm,
    rightMargin=18 * mm,
    topMargin=22 * mm,
    bottomMargin=20 * mm,
    title="Catálogo de servicios y precios - Diego Aguilar",
    author="Diego Aguilar",
    subject="Desarrollo web, sistemas y automatizaciones",
)
frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="normal")
doc.addPageTemplates(PageTemplate(id="all", frames=[frame], onPage=header_footer))

story = []

# Cover
story.append(Spacer(1, 35 * mm))
cover_box = Table(
    [[p("CATÁLOGO COMERCIAL 2026", "CoverKicker")],
     [p("Desarrollo web,<br/>sistemas y automatizaciones", "CoverTitle")],
     [p("Soluciones claras para presentar, vender y organizar mejor los procesos de negocios y emprendedores.", "CoverText")],
     [Table([[p("PROYECTOS DESDE", "Small"), p("USD 120", "Price")]], colWidths=[42 * mm, 62 * mm], style=TableStyle([
         ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#102D50")),
         ("BOX", (0, 0), (-1, -1), 0.7, colors.HexColor("#365578")),
         ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
         ("LEFTPADDING", (0, 0), (-1, -1), 12),
         ("RIGHTPADDING", (0, 0), (-1, -1), 12),
         ("TOPPADDING", (0, 0), (-1, -1), 10),
         ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
     ]))]],
    colWidths=[174 * mm],
    style=TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), NAVY),
        ("LEFTPADDING", (0, 0), (-1, -1), 20),
        ("RIGHTPADDING", (0, 0), (-1, -1), 20),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]),
)
story.append(cover_box)
story.append(Spacer(1, 18 * mm))
story.append(p("<font color='#FFFFFF'><b>Diego Aguilar · Desarrollador Full Stack</b></font>", "CoverText"))
story.append(p("Instagram: @diegoaguilarweb &nbsp;&nbsp;|&nbsp;&nbsp; WhatsApp: +58 424-7245512", "CoverText"))
story.append(PageBreak())

# Overview
story.append(p("OFERTA ORGANIZADA", "SectionKicker"))
story.append(p("Elige el punto de partida adecuado", "H1Custom"))
story.append(p("Los valores publicados son precios base. La cotización definitiva se confirma después de revisar contenido, integraciones, cantidad de información y tiempos.", "BodyCustom"))
story.append(Spacer(1, 5 * mm))
overview = [[p("Servicio", "BodyStrong"), p("Desde", "BodyStrong"), p("Tiempo estimado", "BodyStrong")]]
for service in SERVICES:
    overview.append([p(service["name"], "BodyStrong"), p(service["price"], "BodyStrong"), p(service["time"], "BodyCustom")])
table = Table(overview, colWidths=[88 * mm, 35 * mm, 51 * mm], repeatRows=1)
table.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), NAVY),
    ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
    ("BACKGROUND", (0, 1), (-1, -1), WHITE),
    ("GRID", (0, 0), (-1, -1), 0.6, LINE),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("LEFTPADDING", (0, 0), (-1, -1), 10),
    ("RIGHTPADDING", (0, 0), (-1, -1), 10),
    ("TOPPADDING", (0, 0), (-1, -1), 10),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
]))
story.append(table)
story.append(Spacer(1, 8 * mm))
story.append(p("¿Cómo se calcula el proyecto?", "H2Custom"))
steps = [
    ("1. Servicio base", "Se selecciona la categoría que mejor representa el resultado principal."),
    ("2. Funciones adicionales", "Se agregan solo las integraciones y módulos que el proyecto necesita."),
    ("3. Alcance definitivo", "La propuesta confirma entregables, límites, tiempos, soporte y forma de pago."),
]
step_table = Table([[p(a, "BodyStrong"), p(b, "BodyCustom")] for a, b in steps], colWidths=[48 * mm, 126 * mm])
step_table.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, -1), PALE),
    ("BOX", (0, 0), (-1, -1), 0.6, LINE),
    ("INNERGRID", (0, 0), (-1, -1), 0.6, LINE),
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("LEFTPADDING", (0, 0), (-1, -1), 10),
    ("RIGHTPADDING", (0, 0), (-1, -1), 10),
    ("TOPPADDING", (0, 0), (-1, -1), 9),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
]))
story.append(step_table)
story.append(PageBreak())


def service_section(service):
    meta = Table(
        [[p("DESDE", "Small"), p("TIEMPO ESTIMADO", "Small")],
         [p(service["price"], "Price"), p(service["time"], "BodyStrong")]],
        colWidths=[60 * mm, 70 * mm],
        style=TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), ICE),
            ("BOX", (0, 0), (-1, -1), 0.6, colors.HexColor("#B8D5FA")),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("LEFTPADDING", (0, 0), (-1, -1), 12),
            ("RIGHTPADDING", (0, 0), (-1, -1), 12),
            ("TOPPADDING", (0, 0), (-1, -1), 7),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ]),
    )
    included = [[p("✓", "BodyStrong"), p(item, "BodyCustom")] for item in service["items"]]
    included_table = Table(included, colWidths=[8 * mm, 156 * mm])
    included_table.setStyle(TableStyle([
        ("TEXTCOLOR", (0, 0), (0, -1), GREEN),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]))
    return [
        p("CATEGORÍA DE SERVICIO", "SectionKicker"),
        p(service["name"], "H1Custom"),
        p(service["summary"], "BodyCustom"),
        Spacer(1, 4 * mm),
        meta,
        Spacer(1, 5 * mm),
        p(f"<b>Ideal para:</b> {service['ideal']}", "BodyCustom"),
        Spacer(1, 2 * mm),
        p("Contenido del precio base", "H2Custom"),
        included_table,
        Spacer(1, 5 * mm),
        Table([[p("Importante", "BodyStrong"), p(service["not_included"], "BodyCustom")]], colWidths=[30 * mm, 144 * mm], style=TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), PALE),
            ("BOX", (0, 0), (-1, -1), 0.6, LINE),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 10),
            ("RIGHTPADDING", (0, 0), (-1, -1), 10),
            ("TOPPADDING", (0, 0), (-1, -1), 9),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
        ])),
    ]


for index, service in enumerate(SERVICES):
    story.extend(service_section(service))
    story.append(PageBreak())

# Extras and terms
story.append(p("FUNCIONES ADICIONALES", "SectionKicker"))
story.append(p("Amplía el proyecto según el alcance", "H1Custom"))
story.append(p("Estos valores se suman al servicio base cuando la función no está incluida. El precio puede variar si la integración requiere proveedores, permisos o lógica especial.", "BodyCustom"))
extra_rows = [[p("Función", "BodyStrong"), p("Desde", "BodyStrong")]] + [[p(name, "BodyCustom"), p(price, "BodyStrong")] for name, price in EXTRAS]
extras_table = Table(extra_rows, colWidths=[129 * mm, 45 * mm], repeatRows=1)
extras_table.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), NAVY),
    ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, PALE]),
    ("GRID", (0, 0), (-1, -1), 0.5, LINE),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("LEFTPADDING", (0, 0), (-1, -1), 10),
    ("RIGHTPADDING", (0, 0), (-1, -1), 10),
    ("TOPPADDING", (0, 0), (-1, -1), 7),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
]))
story.append(extras_table)
story.append(Spacer(1, 7 * mm))
story.append(p("Condiciones generales", "H2Custom"))
conditions = [
    "Los precios son referencias iniciales y se confirman después del diagnóstico.",
    "Se sugiere un pago inicial del 50 % para comenzar y el saldo según los hitos acordados.",
    "Dominio, hosting, pasarelas, API y suscripciones externas se cotizan aparte.",
    "El cliente entrega textos, imágenes, logotipo y accesos necesarios, salvo que se contrate su producción.",
    "Cambios fuera del alcance aprobado se presupuestan antes de desarrollarse.",
    "La propuesta final especifica soporte, propiedad de entregables y condiciones de publicación.",
]
story.append(Table([[p("•", "BodyStrong"), p(item, "BodyCustom")] for item in conditions], colWidths=[7 * mm, 167 * mm], style=TableStyle([
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("LEFTPADDING", (0, 0), (-1, -1), 2),
    ("TOPPADDING", (0, 0), (-1, -1), 2),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
])))
story.append(PageBreak())

# Contact
story.append(Spacer(1, 25 * mm))
story.append(p("SIGUIENTE PASO", "SectionKicker"))
story.append(p("Conversemos sobre tu proyecto", "H1Custom"))
story.append(p("Cuéntame el objetivo, las funciones necesarias y el resultado que quieres conseguir. Prepararé una propuesta con alcance, entregables, tiempos y precio definitivo.", "BodyCustom"))
story.append(Spacer(1, 10 * mm))
contact = Table([
    [p("WhatsApp", "BodyStrong"), p("+58 424-7245512", "BodyCustom")],
    [p("Correo", "BodyStrong"), p("diegoalejandroaguilarbello@gmail.com", "BodyCustom")],
    [p("Instagram", "BodyStrong"), p("@diegoaguilarweb", "BodyCustom")],
    [p("LinkedIn", "BodyStrong"), p("Diego Alejandro Aguilar Bello", "BodyCustom")],
], colWidths=[42 * mm, 132 * mm])
contact.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (0, -1), NAVY),
    ("TEXTCOLOR", (0, 0), (0, -1), WHITE),
    ("BACKGROUND", (1, 0), (1, -1), PALE),
    ("GRID", (0, 0), (-1, -1), 0.6, LINE),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("LEFTPADDING", (0, 0), (-1, -1), 12),
    ("RIGHTPADDING", (0, 0), (-1, -1), 12),
    ("TOPPADDING", (0, 0), (-1, -1), 12),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
]))
story.append(contact)
story.append(Spacer(1, 15 * mm))
story.append(Table([[p("DESARROLLO WEB", "BodyStrong"), p("SISTEMAS", "BodyStrong"), p("AUTOMATIZACIONES", "BodyStrong")]], colWidths=[58 * mm] * 3, style=TableStyle([
    ("BACKGROUND", (0, 0), (-1, -1), ICE),
    ("BOX", (0, 0), (-1, -1), 0.6, colors.HexColor("#B8D5FA")),
    ("INNERGRID", (0, 0), (-1, -1), 0.6, colors.HexColor("#B8D5FA")),
    ("ALIGN", (0, 0), (-1, -1), "CENTER"),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("TOPPADDING", (0, 0), (-1, -1), 12),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
])))

doc.build(story)
print(OUTPUT)
