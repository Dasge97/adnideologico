/* ============================================================================
   ADN Ideologico - Neutrality copy revision
   Applies wording changes to keep questions reflective and less leading.
   Execute after init.sql.
   ========================================================================== */

BEGIN;

UPDATE questions
SET
  context = 'En un periodo de subidas fuertes, se debate limitar temporalmente algunos precios para proteger el acceso a bienes basicos.',
  statement = 'En situaciones excepcionales, limitar temporalmente algunos precios puede ser una medida valida.'
WHERE ordinal = 2;

UPDATE questions
SET
  context = 'Una empresa propone simplificar parte de sus normas internas para contratar con mayor rapidez.',
  statement = 'Reducir algunas regulaciones laborales puede facilitar la contratacion en ciertos contextos.'
WHERE ordinal = 3;

UPDATE questions
SET
  context = 'Tras un aumento de delitos, se plantea ampliar el uso de camaras y herramientas de vigilancia en espacios publicos.',
  statement = 'Aceptaria mas vigilancia en espacios publicos si existe evidencia clara de que reduce delitos.'
WHERE ordinal = 7;

UPDATE questions
SET
  context = 'En redes se debate donde poner el limite entre expresion ofensiva y dano social.',
  statement = 'La libertad de expresion debe proteger tambien opiniones muy molestas mientras no inciten a la violencia.'
WHERE ordinal = 9;

UPDATE questions
SET
  context = 'Ante protestas frecuentes, se propone endurecer sanciones para actos no autorizados en la via publica.',
  statement = 'Endurecer sanciones a protestas no autorizadas puede ser aceptable para mantener el orden publico.'
WHERE ordinal = 10;

UPDATE questions
SET
  context = 'Un municipio debate mantener celebraciones tradicionales que reciben criticas por parte de la poblacion.',
  statement = 'Mantener tradiciones locales tiene valor, incluso cuando algunas se perciben como desactualizadas.'
WHERE ordinal = 14;

UPDATE questions
SET
  context = 'En un barrio diverso se discute como equilibrar convivencia comun y expresiones culturales diferentes.',
  statement = 'Es preferible impulsar una cultura civica compartida en lo publico antes que normas culturales paralelas.'
WHERE ordinal = 16;

UPDATE questions
SET
  context = 'Se debate firmar un acuerdo comercial que abarata productos y, al mismo tiempo, aumenta competencia para sectores locales.',
  statement = 'Los acuerdos comerciales pueden beneficiar al conjunto aunque algunos sectores necesiten adaptacion.'
WHERE ordinal = 20;

UPDATE questions
SET
  context = 'Se plantea endurecer controles fronterizos para gestionar mejor los flujos migratorios irregulares.',
  statement = 'Endurecer fronteras puede ser una medida legitima aunque reduzca entradas por motivos economicos.'
WHERE ordinal = 21;

UPDATE questions
SET
  context = 'Una tecnologia emergente promete beneficios relevantes, pero sus efectos a largo plazo aun son inciertos.',
  statement = 'Es razonable esperar y regular antes de desplegar tecnologias masivas con riesgos poco conocidos.'
WHERE ordinal = 26;

UPDATE questions
SET
  context = 'Se propone regular plataformas digitales para limitar desinformacion y practicas abusivas.',
  statement = 'Una regulacion tecnologica mas estricta puede ser necesaria aunque frene parte de la innovacion.'
WHERE ordinal = 28;

UPDATE questions
SET
  context = 'Se discute si limitar algunos productos por su impacto ambiental o confiar en decisiones individuales.',
  statement = 'Para reducir dano ambiental, el Estado deberia evitar imponer restricciones de consumo.'
WHERE ordinal = 33;

COMMIT;
