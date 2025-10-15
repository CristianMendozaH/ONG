--
-- PostgreSQL database dump
--

\restrict ZYtspU5owRvUdUrycC3finPIU5Ue74yxZSC9HfhzG5YaMtaBS4XsFcWzimIHosC

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

-- Started on 2025-10-14 19:45:12

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 5043 (class 1262 OID 24757)
-- Name: sistema_equipos; Type: DATABASE; Schema: -; Owner: postgres
--

CREATE DATABASE sistema_equipos WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'English_United States.1252';


ALTER DATABASE sistema_equipos OWNER TO postgres;

\unrestrict ZYtspU5owRvUdUrycC3finPIU5Ue74yxZSC9HfhzG5YaMtaBS4XsFcWzimIHosC
\connect sistema_equipos
\restrict ZYtspU5owRvUdUrycC3finPIU5Ue74yxZSC9HfhzG5YaMtaBS4XsFcWzimIHosC

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 7 (class 2615 OID 57747)
-- Name: public; Type: SCHEMA; Schema: -; Owner: pg_database_owner
--

CREATE SCHEMA public;


ALTER SCHEMA public OWNER TO pg_database_owner;

--
-- TOC entry 5044 (class 0 OID 0)
-- Dependencies: 7
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: pg_database_owner
--

COMMENT ON SCHEMA public IS 'standard public schema';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 221 (class 1259 OID 57748)
-- Name: activities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.activities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tipo character varying(100) NOT NULL,
    descripcion text NOT NULL,
    fecha timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "equipmentId" uuid,
    "loanId" uuid,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.activities OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 57756)
-- Name: assignments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assignments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    equipment_id uuid NOT NULL,
    collaborator_id uuid NOT NULL,
    assignment_date date NOT NULL,
    release_date date,
    status character varying(50) NOT NULL,
    observations text,
    "createdAt" timestamp with time zone DEFAULT now(),
    "updatedAt" timestamp with time zone DEFAULT now(),
    accessories text[],
    "createdById" uuid
);


ALTER TABLE public.assignments OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 57764)
-- Name: backup_activities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.backup_activities (
    id uuid,
    tipo character varying(100),
    descripcion text,
    fecha timestamp without time zone,
    "equipmentId" uuid,
    "loanId" uuid,
    "createdAt" timestamp without time zone
);


ALTER TABLE public.backup_activities OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 57769)
-- Name: backup_equipments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.backup_equipments (
    id uuid,
    code character varying(255),
    name character varying(255),
    type character varying(255),
    status character varying(255),
    description text,
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone
);


ALTER TABLE public.backup_equipments OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 57774)
-- Name: backup_loans; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.backup_loans (
    id uuid,
    "equipmentId" uuid,
    "borrowerName" character varying(255),
    "loanDate" date,
    "dueDate" date,
    "returnDate" date,
    status character varying(255),
    "overdueDays" integer,
    "totalFine" numeric(10,2),
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone,
    observations text,
    borrowerid uuid
);


ALTER TABLE public.backup_loans OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 57779)
-- Name: backup_maintenances; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.backup_maintenances (
    id uuid,
    "equipmentId" uuid,
    "scheduledDate" date,
    type character varying(255),
    priority character varying(255),
    status character varying(255),
    technician character varying(255),
    description text,
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone,
    technicianid uuid,
    "performedDate" date
);


ALTER TABLE public.backup_maintenances OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 57784)
-- Name: collaborators; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.collaborators (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    full_name character varying(255) NOT NULL,
    "position" character varying(150),
    program character varying(150),
    contact character varying(100),
    is_active boolean DEFAULT true,
    "createdAt" timestamp with time zone DEFAULT now(),
    "updatedAt" timestamp with time zone DEFAULT now(),
    type character varying(50) DEFAULT 'Colaborador'::character varying NOT NULL,
    "createdById" uuid
);


ALTER TABLE public.collaborators OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 57794)
-- Name: config; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.config (
    key character varying(255) NOT NULL,
    value text NOT NULL,
    category character varying(255),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public.config OWNER TO postgres;

--
-- TOC entry 5046 (class 0 OID 0)
-- Dependencies: 228
-- Name: TABLE config; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.config IS 'Almacena pares clave-valor para la configuración del sistema, como multas, etc.';


--
-- TOC entry 229 (class 1259 OID 57799)
-- Name: equipments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.equipments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code character varying(255),
    name character varying(255),
    type character varying(255),
    status character varying(255) DEFAULT 'disponible'::character varying,
    description text,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    serial character varying(255),
    "createdBy" uuid
);


ALTER TABLE public.equipments OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 57806)
-- Name: loans; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.loans (
    id uuid NOT NULL,
    "equipmentId" uuid,
    "borrowerName" character varying(255),
    "loanDate" date,
    "dueDate" date,
    "returnDate" date,
    status character varying(255) DEFAULT 'prestado'::character varying,
    "overdueDays" integer DEFAULT 0,
    "totalFine" numeric(10,2) DEFAULT 0,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    observations text,
    borrowerid uuid,
    "borrowerType" character varying(50) DEFAULT 'Participante'::character varying NOT NULL,
    "borrowerContact" character varying(255),
    "responsiblePartyName" character varying(255),
    "conditionOnReturn" character varying(50),
    "registeredById" uuid,
    accessories text[]
);


ALTER TABLE public.loans OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 57815)
-- Name: maintenances; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.maintenances (
    id uuid NOT NULL,
    "equipmentId" uuid,
    "scheduledDate" date,
    type character varying(255),
    priority character varying(255),
    status character varying(255) DEFAULT 'programado'::character varying,
    technician character varying(255),
    description text,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    technicianid uuid,
    "performedDate" date
);


ALTER TABLE public.maintenances OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 57821)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    name character varying(255),
    email character varying(255),
    "passwordHash" character varying(255),
    role character varying(255) DEFAULT 'user'::character varying,
    active boolean DEFAULT true,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 57828)
-- Name: vista_actividad_mensual; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vista_actividad_mensual AS
 SELECT to_char(date_trunc('month'::text, ("loanDate")::timestamp without time zone), 'Mon YYYY'::text) AS mes,
    count(*) AS prestamos,
    count(
        CASE
            WHEN ("returnDate" IS NOT NULL) THEN 1
            ELSE NULL::integer
        END) AS devoluciones,
    date_trunc('month'::text, ("loanDate")::timestamp without time zone) AS mes_ordenamiento
   FROM public.loans
  WHERE ("loanDate" >= (CURRENT_DATE - '6 mons'::interval))
  GROUP BY (date_trunc('month'::text, ("loanDate")::timestamp without time zone))
  ORDER BY (date_trunc('month'::text, ("loanDate")::timestamp without time zone));


ALTER VIEW public.vista_actividad_mensual OWNER TO postgres;

--
-- TOC entry 234 (class 1259 OID 57833)
-- Name: vista_actividades_recientes; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vista_actividades_recientes AS
 SELECT a.id,
    a.tipo,
    a.descripcion,
    a.fecha,
    COALESCE(e.name, 'Sistema'::character varying) AS equipo,
    COALESCE(l."borrowerName", 'Sistema'::character varying) AS usuario
   FROM ((public.activities a
     LEFT JOIN public.equipments e ON ((a."equipmentId" = e.id)))
     LEFT JOIN public.loans l ON ((a."loanId" = l.id)))
  ORDER BY a.fecha DESC
 LIMIT 20;


ALTER VIEW public.vista_actividades_recientes OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 57838)
-- Name: vista_equipos_populares; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vista_equipos_populares AS
 SELECT e.name AS equipo,
    e.type AS categoria,
    count(l.id) AS total_usos,
    count(
        CASE
            WHEN (l."returnDate" IS NULL) THEN 1
            ELSE NULL::integer
        END) AS usos_activos
   FROM (public.equipments e
     LEFT JOIN public.loans l ON ((e.id = l."equipmentId")))
  WHERE (l."loanDate" >= (CURRENT_DATE - '1 year'::interval))
  GROUP BY e.id, e.name, e.type
 HAVING (count(l.id) > 0)
  ORDER BY (count(l.id)) DESC
 LIMIT 10;


ALTER VIEW public.vista_equipos_populares OWNER TO postgres;

--
-- TOC entry 236 (class 1259 OID 57843)
-- Name: vista_estadisticas_reportes; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vista_estadisticas_reportes AS
 SELECT count(*) AS "totalPrestamos",
    count(
        CASE
            WHEN (((status)::text = 'prestado'::text) OR (("returnDate" IS NULL) AND ("dueDate" >= CURRENT_DATE))) THEN 1
            ELSE NULL::integer
        END) AS "prestamosActivos",
    count(
        CASE
            WHEN ("returnDate" IS NOT NULL) THEN 1
            ELSE NULL::integer
        END) AS "prestamosDevueltos",
    count(
        CASE
            WHEN (("returnDate" IS NULL) AND ("dueDate" < CURRENT_DATE)) THEN 1
            ELSE NULL::integer
        END) AS "prestamosVencidos",
    round(avg(
        CASE
            WHEN ("returnDate" IS NOT NULL) THEN (("returnDate" - "loanDate"))::numeric
            ELSE ((CURRENT_DATE - "loanDate"))::numeric
        END), 2) AS "promedioUso",
    ( SELECT e.name
           FROM (public.equipments e
             JOIN public.loans l2 ON ((e.id = l2."equipmentId")))
          WHERE (l2."loanDate" >= (CURRENT_DATE - '1 year'::interval))
          GROUP BY e.id, e.name
          ORDER BY (count(*)) DESC
         LIMIT 1) AS "equipoMasUsado",
    ( SELECT l3."borrowerName"
           FROM public.loans l3
          WHERE (l3."loanDate" >= (CURRENT_DATE - '1 year'::interval))
          GROUP BY l3."borrowerName"
          ORDER BY (count(*)) DESC
         LIMIT 1) AS "usuarioMasActivo"
   FROM public.loans l
  WHERE ("loanDate" >= (CURRENT_DATE - '1 year'::interval));


ALTER VIEW public.vista_estadisticas_reportes OWNER TO postgres;

--
-- TOC entry 237 (class 1259 OID 57848)
-- Name: vista_kpis_reportes; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vista_kpis_reportes AS
 SELECT ( SELECT count(*) AS count
           FROM public.equipments) AS "totalEquipos",
    ( SELECT count(*) AS count
           FROM public.users
          WHERE (users.active = true)) AS "usuariosActivos",
    ( SELECT count(*) AS count
           FROM public.loans
          WHERE (date_trunc('month'::text, (loans."loanDate")::timestamp without time zone) = date_trunc('month'::text, CURRENT_TIMESTAMP))) AS "prestamosMes",
    round(( SELECT (((count(
                CASE
                    WHEN (loans."returnDate" IS NOT NULL) THEN 1
                    ELSE NULL::integer
                END))::numeric * 100.0) / (NULLIF(count(*), 0))::numeric)
           FROM public.loans
          WHERE (loans."loanDate" >= (CURRENT_DATE - '1 mon'::interval))), 2) AS "tasaDevolucion",
    '+5%'::text AS "cambioEquipos",
    '+12%'::text AS "cambioUsuarios",
    '+8%'::text AS "cambioPrestamos",
    '+3%'::text AS "cambioTasa",
    'positive'::text AS "tendenciaEquipos",
    'positive'::text AS "tendenciaUsuarios",
    'positive'::text AS "tendenciaPrestamos",
    'positive'::text AS "tendenciaTasa";


ALTER VIEW public.vista_kpis_reportes OWNER TO postgres;

--
-- TOC entry 238 (class 1259 OID 57853)
-- Name: vista_proximos_vencimientos; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vista_proximos_vencimientos AS
 SELECT (l.id)::text AS id,
    e.name AS equipo,
    l."borrowerName" AS usuario,
    (l."loanDate")::text AS "fechaPrestamo",
    (l."dueDate")::text AS "fechaDevolucion",
    'Vencido'::text AS estado,
    (CURRENT_DATE - l."loanDate") AS "diasUso"
   FROM (public.loans l
     LEFT JOIN public.equipments e ON ((l."equipmentId" = e.id)))
  WHERE ((l."returnDate" IS NULL) AND (l."dueDate" <= (CURRENT_DATE + '7 days'::interval)))
  ORDER BY l."dueDate";


ALTER VIEW public.vista_proximos_vencimientos OWNER TO postgres;

--
-- TOC entry 239 (class 1259 OID 57858)
-- Name: vista_reportes_estado_equipos; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vista_reportes_estado_equipos AS
 SELECT (id)::text AS id,
    name AS equipo,
    COALESCE(( SELECT loans."borrowerName"
           FROM public.loans
          WHERE ((loans."equipmentId" = e.id) AND (loans."returnDate" IS NULL))
         LIMIT 1), 'N/A'::character varying) AS usuario,
    (("createdAt")::date)::text AS "fechaPrestamo",
        CASE
            WHEN ((status)::text = 'disponible'::text) THEN (CURRENT_DATE)::text
            ELSE NULL::text
        END AS "fechaDevolucion",
        CASE
            WHEN ((status)::text = 'disponible'::text) THEN 'Devuelto'::text
            WHEN ((status)::text = 'prestado'::text) THEN 'Activo'::text
            ELSE 'Vencido'::text
        END AS estado,
    (CURRENT_DATE - ("createdAt")::date) AS "diasUso"
   FROM public.equipments e
  ORDER BY "createdAt" DESC;


ALTER VIEW public.vista_reportes_estado_equipos OWNER TO postgres;

--
-- TOC entry 240 (class 1259 OID 57863)
-- Name: vista_reportes_mantenimiento; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vista_reportes_mantenimiento AS
 SELECT m.id,
    m."performedDate" AS "fechaRealizacion",
    m.type AS tipo,
    m.status AS estado,
    m.technician AS tecnico,
    e.name AS equipo,
    e.code AS "codigoEquipo"
   FROM (public.maintenances m
     JOIN public.equipments e ON ((m."equipmentId" = e.id)));


ALTER VIEW public.vista_reportes_mantenimiento OWNER TO postgres;

--
-- TOC entry 241 (class 1259 OID 57867)
-- Name: vista_reportes_prestamos; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vista_reportes_prestamos AS
 SELECT (l.id)::text AS id,
    COALESCE(e.name, 'Equipo eliminado'::character varying) AS equipo,
    l."borrowerName" AS usuario,
    (l."loanDate")::text AS "fechaPrestamo",
    (l."returnDate")::text AS "fechaDevolucion",
        CASE
            WHEN ((l.status)::text = 'prestado'::text) THEN 'Activo'::text
            WHEN ((l.status)::text = 'devuelto'::text) THEN 'Devuelto'::text
            WHEN ((l."returnDate" IS NULL) AND (l."dueDate" < CURRENT_DATE)) THEN 'Vencido'::text
            WHEN ((l.status)::text = 'vencido'::text) THEN 'Vencido'::text
            ELSE initcap((l.status)::text)
        END AS estado,
        CASE
            WHEN (l."returnDate" IS NOT NULL) THEN (l."returnDate" - l."loanDate")
            ELSE (CURRENT_DATE - l."loanDate")
        END AS "diasUso",
    (l."equipmentId")::text AS "equipoId",
    NULL::text AS "usuarioId",
    COALESCE(l."overdueDays", 0) AS "diasVencido",
    COALESCE(l."totalFine", (0)::numeric) AS "multaTotal"
   FROM (public.loans l
     LEFT JOIN public.equipments e ON ((l."equipmentId" = e.id)))
  ORDER BY l."loanDate" DESC;


ALTER VIEW public.vista_reportes_prestamos OWNER TO postgres;

--
-- TOC entry 242 (class 1259 OID 57872)
-- Name: vista_reportes_usuarios; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vista_reportes_usuarios AS
 SELECT (id)::text AS id,
    'N/A'::text AS equipo,
    name AS usuario,
    (("createdAt")::date)::text AS "fechaPrestamo",
        CASE
            WHEN active THEN NULL::text
            ELSE (CURRENT_DATE)::text
        END AS "fechaDevolucion",
        CASE
            WHEN active THEN 'Activo'::text
            ELSE 'Devuelto'::text
        END AS estado,
    (CURRENT_DATE - ("createdAt")::date) AS "diasUso"
   FROM public.users u
  ORDER BY "createdAt" DESC;


ALTER VIEW public.vista_reportes_usuarios OWNER TO postgres;

--
-- TOC entry 4850 (class 2606 OID 57877)
-- Name: activities activities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT activities_pkey PRIMARY KEY (id);


--
-- TOC entry 4852 (class 2606 OID 57879)
-- Name: assignments assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_pkey PRIMARY KEY (id);


--
-- TOC entry 4854 (class 2606 OID 57881)
-- Name: collaborators collaborators_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.collaborators
    ADD CONSTRAINT collaborators_pkey PRIMARY KEY (id);


--
-- TOC entry 4856 (class 2606 OID 57883)
-- Name: config config_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.config
    ADD CONSTRAINT config_pkey PRIMARY KEY (key);


--
-- TOC entry 4858 (class 2606 OID 57885)
-- Name: equipments equipments_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.equipments
    ADD CONSTRAINT equipments_code_key UNIQUE (code);


--
-- TOC entry 4860 (class 2606 OID 57887)
-- Name: equipments equipments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.equipments
    ADD CONSTRAINT equipments_pkey PRIMARY KEY (id);


--
-- TOC entry 4862 (class 2606 OID 57889)
-- Name: equipments equipments_serial_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.equipments
    ADD CONSTRAINT equipments_serial_key UNIQUE (serial);


--
-- TOC entry 4864 (class 2606 OID 57891)
-- Name: loans loans_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.loans
    ADD CONSTRAINT loans_pkey PRIMARY KEY (id);


--
-- TOC entry 4866 (class 2606 OID 57893)
-- Name: maintenances maintenances_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenances
    ADD CONSTRAINT maintenances_pkey PRIMARY KEY (id);


--
-- TOC entry 4868 (class 2606 OID 57895)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 4870 (class 2606 OID 57897)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4873 (class 2606 OID 57898)
-- Name: assignments assignments_collaborator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_collaborator_id_fkey FOREIGN KEY (collaborator_id) REFERENCES public.collaborators(id);


--
-- TOC entry 4874 (class 2606 OID 57903)
-- Name: assignments assignments_equipment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_equipment_id_fkey FOREIGN KEY (equipment_id) REFERENCES public.equipments(id);


--
-- TOC entry 4871 (class 2606 OID 57908)
-- Name: activities fk_activities_equipment; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT fk_activities_equipment FOREIGN KEY ("equipmentId") REFERENCES public.equipments(id);


--
-- TOC entry 4872 (class 2606 OID 57913)
-- Name: activities fk_activities_loan; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT fk_activities_loan FOREIGN KEY ("loanId") REFERENCES public.loans(id);


--
-- TOC entry 4876 (class 2606 OID 57961)
-- Name: collaborators fk_collaborators_users_creator; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.collaborators
    ADD CONSTRAINT fk_collaborators_users_creator FOREIGN KEY ("createdById") REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 4877 (class 2606 OID 57918)
-- Name: equipments fk_equipments_users; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.equipments
    ADD CONSTRAINT fk_equipments_users FOREIGN KEY ("createdBy") REFERENCES public.users(id);


--
-- TOC entry 4878 (class 2606 OID 57923)
-- Name: loans fk_loans_users; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.loans
    ADD CONSTRAINT fk_loans_users FOREIGN KEY ("registeredById") REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 4881 (class 2606 OID 57928)
-- Name: maintenances fk_technician; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenances
    ADD CONSTRAINT fk_technician FOREIGN KEY (technicianid) REFERENCES public.users(id);


--
-- TOC entry 4879 (class 2606 OID 57933)
-- Name: loans fk_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.loans
    ADD CONSTRAINT fk_user FOREIGN KEY (borrowerid) REFERENCES public.users(id);


--
-- TOC entry 4875 (class 2606 OID 57938)
-- Name: assignments fk_users; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT fk_users FOREIGN KEY ("createdById") REFERENCES public.users(id);


--
-- TOC entry 4880 (class 2606 OID 57943)
-- Name: loans loans_equipmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.loans
    ADD CONSTRAINT "loans_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES public.equipments(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4882 (class 2606 OID 57948)
-- Name: maintenances maintenances_equipmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenances
    ADD CONSTRAINT "maintenances_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES public.equipments(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5045 (class 0 OID 0)
-- Dependencies: 7
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


-- Completed on 2025-10-14 19:45:13

--
-- PostgreSQL database dump complete
--

\unrestrict ZYtspU5owRvUdUrycC3finPIU5Ue74yxZSC9HfhzG5YaMtaBS4XsFcWzimIHosC

