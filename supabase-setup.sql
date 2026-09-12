-- =============================================
-- Baby Shower Eloise — Supabase Setup
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- =============================================

-- 1. Crear tabla de regalos
CREATE TABLE IF NOT EXISTS gifts (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sort_order  INTEGER NOT NULL,
  name        TEXT NOT NULL,
  emoji       TEXT NOT NULL DEFAULT '🎁',
  links       JSONB NOT NULL DEFAULT '[]'::jsonb,
  claimed_by  TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 2. Habilitar Row Level Security (RLS)
ALTER TABLE gifts ENABLE ROW LEVEL SECURITY;

-- 3. Política: todos pueden leer
CREATE POLICY "Lectura pública de regalos"
  ON gifts FOR SELECT
  USING (true);

-- 4. Política: todos pueden actualizar solo claimed_by
CREATE POLICY "Reservar o liberar regalos"
  ON gifts FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- 5. Habilitar Realtime para la tabla
ALTER PUBLICATION supabase_realtime ADD TABLE gifts;

-- 6. Insertar los 18 regalos
INSERT INTO gifts (sort_order, name, emoji, links) VALUES
(1, 'Extractor de leche inalámbrico', '🤱', '[
  {"label": "Opción 1", "url": "https://www.mercadolibre.cl/p/MLC2097547720"},
  {"label": "Opción 2", "url": "https://www.mercadolibre.cl/extractor-de-leche-portatil-manos-libre-sacaleche-electrico-bear-mommy/p/MLC47092261"}
]'::jsonb),

(2, 'Masajeador mamás', '💆', '[
  {"label": "Ver producto", "url": "https://www.balia.cl/products/masajeador-de-lactancia"}
]'::jsonb),

(3, 'Calentador mamaderas portátil / casa', '🍼', '[
  {"label": "Portátil", "url": "https://www.mercadolibre.cl/calentador-de-mamaderas-portatil-con-biberon-y-5-adaptadores/up/MLCU4386468032"},
  {"label": "Casa", "url": "https://www.falabella.com/falabella-cl/product/15726952/Calentador-Mamadera-8110-Bebesit/15726952"}
]'::jsonb),

(4, 'Mochila maternal', '🎒', '[
  {"label": "Ver producto", "url": "https://www.mercadolibre.cl/bolso-maternal-mudador-panalera-bebesit-melange-beige/p/MLC38473590"}
]'::jsonb),

(5, 'Crema Mustela bebé y mamá', '🧴', '[
  {"label": "Hidratante bebé", "url": "https://www.mercadolibre.cl/mustela-hydra-bebe-leche-hidratante-corporal-300ml/p/MLC20666209"},
  {"label": "Anti-estrías mamá", "url": "https://www.mercadolibre.cl/mustela-maternidad-crema-anti-estrias-150-ml-tubo/p/MLC20666206"}
]'::jsonb),

(6, 'Mamaderas Pigeon', '🍶', '[
  {"label": "Kit 3 biberones vidrio", "url": "https://www.mercadolibre.cl/kit-3-biberones-vidrio-pigeon-flexible-50ml-120ml-y-240ml/up/MLCU3832688787"},
  {"label": "Pack 2 SofTouch", "url": "https://www.mercadolibre.cl/pack-2-biberones-pigeon-softouch-160ml-de-vidrio-anticolicos-tetina-silicona-0m-bebe/p/MLC53894659"}
]'::jsonb),

(7, 'Toallitas de baño', '🛁', '[
  {"label": "Ver producto", "url": "https://www.mercadolibre.cl/set-de-toalla-con-capucha-para-bebes-y-toallitas-multiuso-nina/p/MLC49955267"}
]'::jsonb),

(8, 'Aspirador nasal', '👃', '[
  {"label": "Eléctrico", "url": "https://www.mercadolibre.cl/aspirador-nasal-de-remocion-moco-electrico-para-bebes/p/MLC69665723"},
  {"label": "Nariklin", "url": "https://www.mercadolibre.cl/aspirador-nasal-para-bebes-nariklin/p/MLC25258658"}
]'::jsonb),

(9, 'Esterilizador de mamaderas', '✨', '[
  {"label": "Ver producto", "url": "https://www.mercadolibre.cl/calentador-esterilizador-4-mamaderas-8-en-1-control-remoto/up/MLCU3928094170"}
]'::jsonb),

(10, 'Saco de dormir', '🌙', '[
  {"label": "Ver producto", "url": "https://www.opaline.cl/saco-de-dormir-nina/p?idsku=18483"}
]'::jsonb),

(11, 'Kit de aseo y uñas', '💅', '[
  {"label": "Ver producto", "url": "https://www.mercadolibre.cl/kit-completo-de-aseo-y-cuidado-para-bebe-20-piezas/up/MLCU4039240365"}
]'::jsonb),

(12, 'Protector de colchón impermeable', '🛏️', '[
  {"label": "Ver producto", "url": "https://www.mercadolibre.cl/protector-de-colchon-cuna-impermeable-hipoalergenico-133x70-cm-bambu/p/MLC50727603"}
]'::jsonb),

(13, 'Paños de muselina (4 a 6)', '🧶', '[
  {"label": "Ver producto", "url": "https://www.mercadolibre.cl/set-3-panales-muselina-bambino-nina-rosa/up/MLCU4006326358"}
]'::jsonb),

(14, 'Cámara / monitor de bebé', '📹', '[
  {"label": "Bebesit", "url": "https://bebesit.cl/products/monitor-digital-portatil"},
  {"label": "SoyMomo", "url": "https://soymomo.cl/products/soymomo-baby-monitor-lite"}
]'::jsonb),

(15, 'Shampoo y jabón Eucerin bebé', '🫧', '[
  {"label": "Ver producto", "url": "https://www.mercadolibre.cl/pack-eucerin-baby-shampoo-y-crema-corporal-400ml-cu/p/MLC52313773"}
]'::jsonb),

(16, 'Crema protectora (Bepanthol / Aquaphor / Pasta Lasar)', '🩹', '[
  {"label": "Bepanthol", "url": "https://www.mercadolibre.cl/bepanthol-crema-unguento-protector-regenerador-30g/p/MLC22380041"},
  {"label": "Aquaphor", "url": "https://www.lider.cl/ip/panales-y-toallitas-humedas/pasta-para-dermatitis-del-panal-aquaphor-baby-tubo-de-100-ml/00007214002661"}
]'::jsonb),

(17, 'Osito de algodón (bodies o enteritos)', '🧸', '[
  {"label": "Modelo 1", "url": "https://tuttito.cl/producto/osito-algodon-bordado-13/"},
  {"label": "Modelo 2", "url": "https://tuttito.cl/producto/osito-algodon-bordado-10/"},
  {"label": "Modelo 3", "url": "https://tuttito.cl/producto/osito-algodon-bordado-3/"}
]'::jsonb),

(18, 'Ajuares', '👗', '[]'::jsonb);
