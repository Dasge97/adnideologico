/* ============================================================================
   ADN Ideológico — Esquema SQL (PostgreSQL)
   - Campaña sin registro (sesiones anónimas)
   - Test: 36 preguntas (6 ejes x 6 ítems)
   - Respuesta 1..7 (Muy en desacuerdo .. Muy de acuerdo)
   - Contexto neutro por pregunta (para “no parecer robot”)
   - Feedback libre post-compartir
   ========================================================================== */

BEGIN;

-- Extensiones útiles (Postgres)
CREATE EXTENSION IF NOT EXISTS pgcrypto;  -- gen_random_uuid()

/* --------------------------------------------------------------------------
   1) Catálogos base
   -------------------------------------------------------------------------- */

DROP TABLE IF EXISTS feedback_messages CASCADE;
DROP TABLE IF EXISTS answers CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS axes CASCADE;

CREATE TABLE axes (
  axis_id        SMALLSERIAL PRIMARY KEY,
  code           TEXT NOT NULL UNIQUE,            -- e.g. ECON, LIB, CULT...
  name           TEXT NOT NULL,                   -- e.g. "Economía"
  left_label     TEXT NOT NULL,                   -- etiqueta del extremo (-)
  right_label    TEXT NOT NULL,                   -- etiqueta del extremo (+)
  description    TEXT NOT NULL
);

CREATE TABLE questions (
  question_id    SERIAL PRIMARY KEY,
  axis_id        SMALLINT NOT NULL REFERENCES axes(axis_id) ON DELETE RESTRICT,
  ordinal        SMALLINT NOT NULL,               -- orden recomendado (1..36)
  title          TEXT NOT NULL,                   -- título corto (opcional)
  context        TEXT NOT NULL,                   -- mini situación neutra
  statement      TEXT NOT NULL,                   -- afirmación a valorar 1..7
  is_reversed    BOOLEAN NOT NULL DEFAULT FALSE,  -- si TRUE, invierte scoring
  weight         NUMERIC(6,3) NOT NULL DEFAULT 1.0,
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_questions_ordinal UNIQUE (ordinal)
);

COMMENT ON COLUMN questions.is_reversed IS
'Si TRUE, la puntuación normalizada se invierte: score = -score';

CREATE TABLE sessions (
  session_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at    TIMESTAMPTZ NULL,

  -- Anti-abuso / analítica (guardando hash, no la IP en claro)
  ip_hash        TEXT NULL,        -- e.g. SHA256(ip + salt) en backend
  fingerprint    TEXT NULL,        -- opcional (ua+tz+screen, etc), hasheado
  user_agent     TEXT NULL,
  accept_lang    TEXT NULL,

  -- Contexto geográfico opcional (sin precisión excesiva)
  country_code   CHAR(2) NULL,
  region         TEXT NULL,        -- CCAA / provincia si lo calculas
  city           TEXT NULL,        -- opcional (mejor evitar si no hace falta)

  -- Flags
  is_flagged     BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE answers (
  session_id     UUID NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
  question_id    INT  NOT NULL REFERENCES questions(question_id) ON DELETE RESTRICT,
  value          SMALLINT NOT NULL CHECK (value BETWEEN 1 AND 7),
  answered_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (session_id, question_id)
);

CREATE TABLE feedback_messages (
  feedback_id    BIGSERIAL PRIMARY KEY,
  session_id     UUID NULL REFERENCES sessions(session_id) ON DELETE SET NULL,
  message        TEXT NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- opcional: "¿te lo esperabas?" sin presionar (3 estados)
  expectedness   SMALLINT NULL CHECK (expectedness IN (1,2,3))
  -- 1=Sí, 2=Más o menos, 3=No
);

CREATE INDEX idx_answers_question ON answers(question_id);
CREATE INDEX idx_answers_session  ON answers(session_id);
CREATE INDEX idx_sessions_started ON sessions(started_at);

 /* --------------------------------------------------------------------------
   2) Inserts: Ejes (6)
   -------------------------------------------------------------------------- */

INSERT INTO axes (code, name, left_label, right_label, description) VALUES
('ECON', 'Economía', 'Más mercado', 'Más redistribución',
 'Grado de intervención pública, impuestos, regulación y protección social.'),
('LIB', 'Libertades civiles', 'Más control', 'Más libertades',
 'Balance entre seguridad/orden y derechos individuales (privacidad, expresión, etc.).'),
('CULT', 'Valores culturales', 'Más tradición', 'Más progresismo',
 'Actitudes ante cambios sociales, diversidad, costumbres y normas culturales.'),
('GLOB', 'Globalización', 'Más soberanía', 'Más cooperación',
 'Preferencia por decisiones nacionales vs. integración internacional (UE, acuerdos, migración).'),
('TECH', 'Tecnología y ciencia', 'Más precaución', 'Más innovación',
 'Apetito por el avance tecnológico rápido vs. regulación y cautela ante riesgos.'),
('ECO', 'Medio ambiente', 'Más crecimiento', 'Más sostenibilidad',
 'Prioridad relativa entre economía y protección ambiental (energía, consumo, regulación).');

 /* --------------------------------------------------------------------------
   3) Inserts: 36 preguntas (6 por eje)
   Notas:
   - Cada pregunta incluye CONTEXTO (situación neutra) + STATEMENT (afirmación)
   - Algunas están invertidas (is_reversed) para consistencia interna
   - ordinal 1..36 en bloques por eje (puedes barajar luego en frontend)
   -------------------------------------------------------------------------- */

-- ECON (1..6)
INSERT INTO questions (axis_id, ordinal, title, context, statement, is_reversed, weight) VALUES
((SELECT axis_id FROM axes WHERE code='ECON'),  1, 'Impuestos y servicios',
 'Un ayuntamiento plantea subir ligeramente impuestos locales para reforzar servicios básicos (limpieza, mantenimiento y ayudas puntuales).',
 'Prefiero pagar más impuestos si eso mejora servicios públicos y reduce desigualdades.', FALSE, 1.0),

((SELECT axis_id FROM axes WHERE code='ECON'),  2, 'Regulación de precios',
 'En un periodo de subidas fuertes, se debate limitar temporalmente ciertos precios (por ejemplo, alquileres o energía) para evitar que se disparen.',
 'El Estado debería poder limitar precios en situaciones excepcionales para proteger a la población.', FALSE, 1.0),

((SELECT axis_id FROM axes WHERE code='ECON'),  3, 'Flexibilidad laboral',
 'Una empresa quiere flexibilizar condiciones para contratar más rápido, argumentando que así crea empleo más fácilmente.',
 'Reducir regulaciones laborales suele ayudar más a crear empleo que mantener protecciones fuertes.', TRUE, 1.0),

((SELECT axis_id FROM axes WHERE code='ECON'),  4, 'Ayudas y responsabilidad',
 'Se discute si ampliar ayudas económicas aunque algunas personas puedan abusar del sistema en casos puntuales.',
 'Es preferible aceptar cierto abuso puntual si con ello se garantiza una red de protección amplia.', FALSE, 1.0),

((SELECT axis_id FROM axes WHERE code='ECON'),  5, 'Privatización vs público',
 'En sanidad o transporte, se plantea externalizar parte del servicio para “mejorar eficiencia” y reducir listas de espera.',
 'En general, prefiero que los servicios esenciales los gestione directamente lo público, aunque sea menos eficiente.', FALSE, 1.0),

((SELECT axis_id FROM axes WHERE code='ECON'),  6, 'Impuestos a grandes patrimonios',
 'Se propone un impuesto específico para grandes patrimonios con el objetivo de financiar políticas sociales.',
 'Los grandes patrimonios deberían aportar proporcionalmente más, aunque eso desincentive parte de la inversión.', FALSE, 1.0);

-- LIB (7..12)
INSERT INTO questions (axis_id, ordinal, title, context, statement, is_reversed, weight) VALUES
((SELECT axis_id FROM axes WHERE code='LIB'),  7, 'Vigilancia y delito',
 'Tras un aumento de delitos, se propone ampliar cámaras y herramientas de vigilancia en espacios públicos.',
 'Acepto más vigilancia en espacios públicos si reduce de forma clara la delincuencia.', TRUE, 1.0),

((SELECT axis_id FROM axes WHERE code='LIB'),  8, 'Privacidad digital',
 'Una nueva ley permitiría a autoridades acceder más fácilmente a datos digitales en investigaciones.',
 'La privacidad digital debería limitarse lo mínimo imprescindible, incluso en nombre de la seguridad.', FALSE, 1.0),

((SELECT axis_id FROM axes WHERE code='LIB'),  9, 'Libertad de expresión',
 'En redes sociales se debate si prohibir discursos ofensivos aunque no llamen directamente a la violencia.',
 'La libertad de expresión debe proteger incluso opiniones muy ofensivas, mientras no inciten a la violencia.', FALSE, 1.0),

((SELECT axis_id FROM axes WHERE code='LIB'), 10, 'Estado y protestas',
 'Ante protestas frecuentes, se plantea endurecer sanciones administrativas para “mantener el orden”.',
 'Endurecer sanciones a protestas no autorizadas es aceptable para preservar la convivencia.', TRUE, 1.0),

((SELECT axis_id FROM axes WHERE code='LIB'), 11, 'Derechos vs eficiencia',
 'En trámites públicos, se sugiere simplificar procesos aunque reduzca ciertas garantías (recursos, revisión, etc.).',
 'Prefiero mantener garantías y derechos procesales aunque eso ralentice la administración.', FALSE, 1.0),

((SELECT axis_id FROM axes WHERE code='LIB'), 12, 'Políticas de drogas',
 'Se debate si descriminalizar ciertas drogas para enfocarse en salud pública en vez de castigo penal.',
 'La descriminalización controlada puede ser más efectiva que el castigo penal para reducir daños.', FALSE, 1.0);

-- CULT (13..18)
INSERT INTO questions (axis_id, ordinal, title, context, statement, is_reversed, weight) VALUES
((SELECT axis_id FROM axes WHERE code='CULT'), 13, 'Cambios sociales',
 'Una escuela revisa su programa para incluir nuevos modelos familiares y realidades sociales actuales.',
 'La educación debería adaptarse a los cambios sociales aunque incomode a parte de la población.', FALSE, 1.0),

((SELECT axis_id FROM axes WHERE code='CULT'), 14, 'Tradición local',
 'Un municipio debate mantener celebraciones tradicionales pese a críticas por considerarlas desactualizadas.',
 'Mantener tradiciones es importante incluso si algunas prácticas chocan con valores modernos.', TRUE, 1.0),

((SELECT axis_id FROM axes WHERE code='CULT'), 15, 'Roles y cultura',
 'En debates culturales se discute si la sociedad debería promover activamente igualdad en roles de género.',
 'Las instituciones deberían promover activamente la igualdad de roles y oportunidades, no solo “dejar que ocurra”.', FALSE, 1.0),

((SELECT axis_id FROM axes WHERE code='CULT'), 16, 'Identidad y convivencia',
 'En un barrio diverso, se debate si priorizar integración a una cultura común o aceptar múltiples normas culturales.',
 'Es mejor promover una cultura cívica compartida que permitir normas culturales muy distintas en lo público.', TRUE, 1.0),

((SELECT axis_id FROM axes WHERE code='CULT'), 17, 'Derechos LGTBI',
 'Una administración plantea ampliar protecciones contra discriminación en empleo y vivienda.',
 'Ampliar protecciones legales contra discriminación es una prioridad social.', FALSE, 1.0),

((SELECT axis_id FROM axes WHERE code='CULT'), 18, 'Cambio generacional',
 'Se discute si el Estado debería impulsar cambios culturales (lenguaje inclusivo, campañas) o mantenerse neutral.',
 'El Estado debería mantenerse neutral en debates culturales y no impulsar cambios simbólicos.', TRUE, 1.0);

-- GLOB (19..24)
INSERT INTO questions (axis_id, ordinal, title, context, statement, is_reversed, weight) VALUES
((SELECT axis_id FROM axes WHERE code='GLOB'), 19, 'UE y decisiones',
 'Ante una crisis, se decide si seguir una directriz europea común o tomar medidas nacionales distintas.',
 'En general, prefiero coordinar decisiones con la UE aunque limite decisiones nacionales.', FALSE, 1.0),

((SELECT axis_id FROM axes WHERE code='GLOB'), 20, 'Comercio internacional',
 'Se debate firmar un acuerdo comercial que abarata productos, pero compite con productores locales.',
 'Los acuerdos comerciales suelen beneficiar al conjunto, aunque perjudiquen a algunos sectores.', FALSE, 1.0),

((SELECT axis_id FROM axes WHERE code='GLOB'), 21, 'Fronteras y migración',
 'Se plantea endurecer controles fronterizos para reducir entradas irregulares.',
 'Es legítimo endurecer fronteras incluso si eso reduce entradas de personas que buscan oportunidades.', TRUE, 1.0),

((SELECT axis_id FROM axes WHERE code='GLOB'), 22, 'Refugio y asilo',
 'Un país recibe solicitudes de asilo y se debate aumentar la capacidad de acogida.',
 'Deberíamos ampliar la acogida de refugiados cuando sea posible, incluso con costes económicos.', FALSE, 1.0),

((SELECT axis_id FROM axes WHERE code='GLOB'), 23, 'Soberanía energética',
 'Se debate depender de importaciones energéticas baratas frente a impulsar producción interna más cara.',
 'Prefiero pagar algo más por energía si aumenta la autonomía y reduce dependencias externas.', FALSE, 1.0),

((SELECT axis_id FROM axes WHERE code='GLOB'), 24, 'Organismos internacionales',
 'Se cuestiona si aceptar resoluciones internacionales cuando chocan con políticas internas.',
 'Los organismos internacionales tienen demasiada influencia sobre decisiones que deberían ser nacionales.', TRUE, 1.0);

-- TECH (25..30)
INSERT INTO questions (axis_id, ordinal, title, context, statement, is_reversed, weight) VALUES
((SELECT axis_id FROM axes WHERE code='TECH'), 25, 'IA en servicios',
 'Se propone usar IA para priorizar citas médicas y trámites, reduciendo tiempos, con supervisión humana.',
 'Deberíamos adoptar IA en servicios públicos si mejora eficiencia, aunque no sea perfecta.', FALSE, 1.0),

((SELECT axis_id FROM axes WHERE code='TECH'), 26, 'Riesgo tecnológico',
 'Un nuevo avance promete grandes beneficios, pero todavía no se conocen bien sus riesgos a largo plazo.',
 'Es mejor esperar y regular antes de desplegar nuevas tecnologías masivas.', TRUE, 1.0),

((SELECT axis_id FROM axes WHERE code='TECH'), 27, 'Datos para investigación',
 'Se debate permitir usar datos anonimizados (salud, movilidad) para investigación científica y planificación.',
 'Permitir el uso de datos anonimizados para investigación es positivo si hay controles estrictos.', FALSE, 1.0),

((SELECT axis_id FROM axes WHERE code='TECH'), 28, 'Regulación de plataformas',
 'Se propone regular redes sociales y plataformas para reducir desinformación y prácticas abusivas.',
 'Hace falta más regulación tecnológica aunque frene la innovación en el corto plazo.', TRUE, 1.0),

((SELECT axis_id FROM axes WHERE code='TECH'), 29, 'Educación y futuro',
 'Se plantea invertir fuerte en formación tecnológica, aunque implique recortar en otras áreas menos demandadas.',
 'Priorizar educación tecnológica es clave para el futuro, incluso si desplaza otras prioridades.', FALSE, 1.0),

((SELECT axis_id FROM axes WHERE code='TECH'), 30, 'Biotecnología',
 'Se discute permitir avances biomédicos (por ejemplo, edición genética terapéutica) con marcos éticos.',
 'La biotecnología debería avanzar con rapidez en usos terapéuticos si salva vidas.', FALSE, 1.0);

-- ECO (31..36)
INSERT INTO questions (axis_id, ordinal, title, context, statement, is_reversed, weight) VALUES
((SELECT axis_id FROM axes WHERE code='ECO'), 31, 'Prioridad climática',
 'Una región plantea medidas para reducir emisiones aunque afecten a algunos sectores económicos.',
 'Proteger el medio ambiente debe ser prioritario aunque frene parte del crecimiento económico.', FALSE, 1.0),

((SELECT axis_id FROM axes WHERE code='ECO'), 32, 'Transición energética',
 'Se debate acelerar renovables y electrificación aunque suba el coste a corto plazo.',
 'Es aceptable asumir costes a corto plazo si acelera una transición energética sostenible.', FALSE, 1.0),

((SELECT axis_id FROM axes WHERE code='ECO'), 33, 'Restricciones al consumo',
 'Se discute limitar ciertos productos o prácticas por su impacto ambiental.',
 'El Estado debería evitar imponer restricciones de consumo y confiar más en decisiones individuales.', TRUE, 1.0),

((SELECT axis_id FROM axes WHERE code='ECO'), 34, 'Industria y empleo',
 'Una industria contamina, pero sostiene mucho empleo local; se debate endurecer normas ambientales.',
 'Es preferible endurecer normas ambientales aunque eso obligue a reconvertir empleos.', FALSE, 1.0),

((SELECT axis_id FROM axes WHERE code='ECO'), 35, 'Infraestructura verde',
 'Un plan público propone invertir en transporte público y ciudades caminables, con obras y cambios urbanos.',
 'Invertir en infraestructura verde y transporte público debería ser una prioridad presupuestaria.', FALSE, 1.0),

((SELECT axis_id FROM axes WHERE code='ECO'), 36, 'Energía nuclear',
 'Se debate mantener o ampliar nuclear para reducir emisiones, frente a apostar solo por renovables.',
 'Mantener o ampliar nuclear puede ser una opción razonable dentro de la transición energética.', FALSE, 1.0);

COMMIT;

/* ============================================================================
   Notas de integración (para tu backend, no ejecuta nada):
   - Normalización recomendada:
       norm = (value - 4) / 3   --> rango [-1, +1]
       if is_reversed: norm = -norm
       axis_score = SUM(norm * weight) / SUM(weight)
   - Radar: usa axis_score por cada eje.
   - Estadísticas:
       - contador perfiles creados = COUNT(*) sessions con finished_at NOT NULL
       - medias por eje = JOIN answers+questions+axes y agregación
   ========================================================================== */