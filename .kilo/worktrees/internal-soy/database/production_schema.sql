--
-- PostgreSQL database dump
--

\restrict Pwc6dfDvpsHbroxaqR1PzM7UuqRtXq4HPvxLfUat55ylUtprUXQTHamTvAtUJXI

-- Dumped from database version 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: account_transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.account_transactions (
    id integer NOT NULL,
    account_id integer NOT NULL,
    type character varying(20) NOT NULL,
    amount numeric(14,2) NOT NULL,
    reference character varying(120),
    note text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.account_transactions OWNER TO postgres;

--
-- Name: account_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.account_transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.account_transactions_id_seq OWNER TO postgres;

--
-- Name: account_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.account_transactions_id_seq OWNED BY public.account_transactions.id;


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id integer NOT NULL,
    user_id integer,
    action character varying(100) NOT NULL,
    table_name character varying(50),
    record_id integer,
    old_data jsonb,
    new_data jsonb,
    ip_address character varying(50),
    created_at timestamp without time zone DEFAULT now(),
    severity character varying(20) DEFAULT 'INFO'::character varying,
    device_id character varying(100)
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_logs_id_seq OWNER TO postgres;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- Name: brands; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.brands (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    deleted_at timestamp without time zone,
    deleted_by integer
);


ALTER TABLE public.brands OWNER TO postgres;

--
-- Name: brands_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.brands_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.brands_id_seq OWNER TO postgres;

--
-- Name: brands_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.brands_id_seq OWNED BY public.brands.id;


--
-- Name: business_profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.business_profiles (
    id integer NOT NULL,
    business_name character varying(150) NOT NULL,
    tagline character varying(200),
    phone character varying(50) NOT NULL,
    email character varying(100),
    address text,
    logo_url character varying(255),
    currency character varying(10) DEFAULT 'BDT'::character varying,
    vat_percentage numeric(5,2) DEFAULT 0,
    invoice_terms text,
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.business_profiles OWNER TO postgres;

--
-- Name: business_profiles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.business_profiles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.business_profiles_id_seq OWNER TO postgres;

--
-- Name: business_profiles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.business_profiles_id_seq OWNED BY public.business_profiles.id;


--
-- Name: categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    deleted_at timestamp without time zone,
    deleted_by integer
);


ALTER TABLE public.categories OWNER TO postgres;

--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categories_id_seq OWNER TO postgres;

--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Name: customers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customers (
    id integer NOT NULL,
    name character varying(150) NOT NULL,
    phone character varying(50) NOT NULL,
    email character varying(100),
    address text,
    customer_type character varying(30) DEFAULT 'retail'::character varying,
    receivable_balance numeric(14,2) DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    user_role character varying(30) DEFAULT 'regular'::character varying,
    deleted_at timestamp without time zone,
    loyalty_points numeric(10,2) DEFAULT 0.00,
    deleted_by integer
);


ALTER TABLE public.customers OWNER TO postgres;

--
-- Name: customers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.customers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.customers_id_seq OWNER TO postgres;

--
-- Name: customers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.customers_id_seq OWNED BY public.customers.id;


--
-- Name: daily_summaries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.daily_summaries (
    id integer NOT NULL,
    summary_date date NOT NULL,
    total_sales numeric(14,2) DEFAULT 0,
    total_purchases numeric(14,2) DEFAULT 0,
    total_expenses numeric(14,2) DEFAULT 0,
    net_profit numeric(14,2) DEFAULT 0,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.daily_summaries OWNER TO postgres;

--
-- Name: daily_summaries_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.daily_summaries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.daily_summaries_id_seq OWNER TO postgres;

--
-- Name: daily_summaries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.daily_summaries_id_seq OWNED BY public.daily_summaries.id;


--
-- Name: damaged_products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.damaged_products (
    id integer NOT NULL,
    product_id integer,
    quantity integer NOT NULL,
    note text,
    recorded_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.damaged_products OWNER TO postgres;

--
-- Name: damaged_products_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.damaged_products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.damaged_products_id_seq OWNER TO postgres;

--
-- Name: damaged_products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.damaged_products_id_seq OWNED BY public.damaged_products.id;


--
-- Name: device_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.device_sessions (
    id integer NOT NULL,
    device_id character varying(100) NOT NULL,
    device_type character varying(20) NOT NULL,
    device_name character varying(200) NOT NULL,
    ip_address character varying(100),
    user_agent text,
    last_active timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.device_sessions OWNER TO postgres;

--
-- Name: device_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.device_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.device_sessions_id_seq OWNER TO postgres;

--
-- Name: device_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.device_sessions_id_seq OWNED BY public.device_sessions.id;


--
-- Name: ecommerce_order_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ecommerce_order_items (
    id integer NOT NULL,
    order_id integer NOT NULL,
    product_id integer NOT NULL,
    quantity integer NOT NULL,
    unit_price numeric(14,2) NOT NULL
);


ALTER TABLE public.ecommerce_order_items OWNER TO postgres;

--
-- Name: ecommerce_order_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ecommerce_order_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ecommerce_order_items_id_seq OWNER TO postgres;

--
-- Name: ecommerce_order_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ecommerce_order_items_id_seq OWNED BY public.ecommerce_order_items.id;


--
-- Name: ecommerce_orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ecommerce_orders (
    id integer NOT NULL,
    order_number character varying(30) NOT NULL,
    customer_name character varying(100) NOT NULL,
    customer_phone character varying(50) NOT NULL,
    shipping_address text NOT NULL,
    delivery_charge numeric(10,2) DEFAULT 0,
    total_amount numeric(14,2) NOT NULL,
    payment_status character varying(20) DEFAULT 'unpaid'::character varying,
    order_status character varying(30) DEFAULT 'processing'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    order_no character varying(50),
    courier_name character varying(100),
    tracking_code character varying(100),
    customer_notes text,
    payment_method character varying(50) DEFAULT 'cod'::character varying,
    deleted_at timestamp without time zone,
    deleted_by integer
);


ALTER TABLE public.ecommerce_orders OWNER TO postgres;

--
-- Name: ecommerce_orders_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ecommerce_orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ecommerce_orders_id_seq OWNER TO postgres;

--
-- Name: ecommerce_orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ecommerce_orders_id_seq OWNED BY public.ecommerce_orders.id;


--
-- Name: expense_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.expense_categories (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    description text
);


ALTER TABLE public.expense_categories OWNER TO postgres;

--
-- Name: expense_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.expense_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.expense_categories_id_seq OWNER TO postgres;

--
-- Name: expense_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.expense_categories_id_seq OWNED BY public.expense_categories.id;


--
-- Name: expenses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.expenses (
    id integer NOT NULL,
    category_id integer,
    account_id integer,
    amount numeric(14,2) NOT NULL,
    expense_date date DEFAULT CURRENT_DATE,
    reference_no character varying(100),
    note text,
    created_by integer,
    created_at timestamp without time zone DEFAULT now(),
    voucher_no character varying(100),
    category_name character varying(150),
    account_name character varying(150),
    payee_name character varying(150),
    deleted_at timestamp without time zone,
    deleted_by integer
);


ALTER TABLE public.expenses OWNER TO postgres;

--
-- Name: expenses_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.expenses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.expenses_id_seq OWNER TO postgres;

--
-- Name: expenses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.expenses_id_seq OWNED BY public.expenses.id;


--
-- Name: financial_accounts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.financial_accounts (
    id integer NOT NULL,
    account_name character varying(100) NOT NULL,
    account_type character varying(50) NOT NULL,
    account_number character varying(100),
    balance numeric(14,2) DEFAULT 0.00,
    deleted_at timestamp without time zone,
    deleted_by integer
);


ALTER TABLE public.financial_accounts OWNER TO postgres;

--
-- Name: financial_accounts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.financial_accounts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.financial_accounts_id_seq OWNER TO postgres;

--
-- Name: financial_accounts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.financial_accounts_id_seq OWNED BY public.financial_accounts.id;


--
-- Name: ip_rules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ip_rules (
    id integer NOT NULL,
    ip_address character varying(50) NOT NULL,
    rule_type character varying(20) DEFAULT 'block'::character varying NOT NULL,
    reason character varying(255),
    blocked_attempts integer DEFAULT 0,
    created_by integer,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.ip_rules OWNER TO postgres;

--
-- Name: ip_rules_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ip_rules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ip_rules_id_seq OWNER TO postgres;

--
-- Name: ip_rules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ip_rules_id_seq OWNED BY public.ip_rules.id;


--
-- Name: menu_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.menu_items (
    id integer NOT NULL,
    label character varying(80) NOT NULL,
    slug character varying(80) NOT NULL,
    icon character varying(40) NOT NULL,
    route_key character varying(80) NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL
);


ALTER TABLE public.menu_items OWNER TO postgres;

--
-- Name: menu_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.menu_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.menu_items_id_seq OWNER TO postgres;

--
-- Name: menu_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.menu_items_id_seq OWNED BY public.menu_items.id;


--
-- Name: menu_sub_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.menu_sub_items (
    id integer NOT NULL,
    menu_item_id integer NOT NULL,
    label character varying(120) NOT NULL,
    route_key character varying(80) NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.menu_sub_items OWNER TO postgres;

--
-- Name: menu_sub_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.menu_sub_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.menu_sub_items_id_seq OWNER TO postgres;

--
-- Name: menu_sub_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.menu_sub_items_id_seq OWNED BY public.menu_sub_items.id;


--
-- Name: models; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.models (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    brand_id integer NOT NULL,
    category_id integer,
    sub_category_id integer,
    deleted_at timestamp without time zone,
    deleted_by integer
);


ALTER TABLE public.models OWNER TO postgres;

--
-- Name: models_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.models_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.models_id_seq OWNER TO postgres;

--
-- Name: models_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.models_id_seq OWNED BY public.models.id;


--
-- Name: payment_accounts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment_accounts (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    account_type character varying(30) DEFAULT 'drawer'::character varying NOT NULL,
    balance numeric(14,2) DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true,
    deleted_at timestamp without time zone
);


ALTER TABLE public.payment_accounts OWNER TO postgres;

--
-- Name: payment_accounts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payment_accounts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payment_accounts_id_seq OWNER TO postgres;

--
-- Name: payment_accounts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payment_accounts_id_seq OWNED BY public.payment_accounts.id;


--
-- Name: payment_methods; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment_methods (
    id integer NOT NULL,
    method_name character varying(100) NOT NULL,
    is_active boolean DEFAULT true,
    account_details text,
    deleted_at timestamp without time zone,
    deleted_by integer
);


ALTER TABLE public.payment_methods OWNER TO postgres;

--
-- Name: payment_methods_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payment_methods_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payment_methods_id_seq OWNER TO postgres;

--
-- Name: payment_methods_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payment_methods_id_seq OWNED BY public.payment_methods.id;


--
-- Name: permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.permissions (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    module_name character varying(100),
    code character varying(100)
);


ALTER TABLE public.permissions OWNER TO postgres;

--
-- Name: permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.permissions_id_seq OWNER TO postgres;

--
-- Name: permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.permissions_id_seq OWNED BY public.permissions.id;


--
-- Name: product_images; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_images (
    id integer NOT NULL,
    product_id integer NOT NULL,
    image_url text NOT NULL,
    image_type character varying(20) DEFAULT 'gallery'::character varying NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.product_images OWNER TO postgres;

--
-- Name: product_images_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.product_images_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.product_images_id_seq OWNER TO postgres;

--
-- Name: product_images_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.product_images_id_seq OWNED BY public.product_images.id;


--
-- Name: product_names; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_names (
    id integer NOT NULL,
    name character varying(150) NOT NULL,
    brand_id integer,
    category_id integer,
    sub_category_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp without time zone,
    deleted_by integer
);


ALTER TABLE public.product_names OWNER TO postgres;

--
-- Name: product_names_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.product_names_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.product_names_id_seq OWNER TO postgres;

--
-- Name: product_names_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.product_names_id_seq OWNED BY public.product_names.id;


--
-- Name: product_returns; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_returns (
    id integer NOT NULL,
    return_no character varying(50) NOT NULL,
    order_source character varying(20) DEFAULT 'offline'::character varying,
    invoice_no character varying(50),
    ecommerce_order_no character varying(50),
    customer_id integer,
    product_id integer,
    return_qty integer NOT NULL,
    refund_amount numeric(14,2) DEFAULT 0.00,
    return_reason text,
    condition character varying(50) DEFAULT 'Good'::character varying,
    return_date timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone,
    customer_name character varying(150),
    customer_phone character varying(50),
    product_name character varying(255),
    serial_code character varying(100),
    return_type character varying(50) DEFAULT 'Refund'::character varying,
    refund_method character varying(50) DEFAULT 'Cash'::character varying,
    deleted_by integer
);


ALTER TABLE public.product_returns OWNER TO postgres;

--
-- Name: product_returns_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.product_returns_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.product_returns_id_seq OWNER TO postgres;

--
-- Name: product_returns_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.product_returns_id_seq OWNED BY public.product_returns.id;


--
-- Name: product_sku_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.product_sku_seq
    START WITH 1001
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.product_sku_seq OWNER TO postgres;

--
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.products (
    id integer NOT NULL,
    name character varying(150) NOT NULL,
    short_name character varying(100),
    sku character varying(100) DEFAULT ('SKU-'::text || lpad((nextval('public.product_sku_seq'::regclass))::text, 5, '0'::text)),
    barcode character varying(100),
    description text,
    category_id integer,
    sub_category_id integer,
    brand_id integer,
    model_id integer,
    series_id integer,
    purchase_price numeric(12,2) DEFAULT 0,
    selling_price numeric(12,2) DEFAULT 0,
    mrp numeric(12,2) DEFAULT 0,
    stock integer DEFAULT 0,
    min_stock integer DEFAULT 0,
    purchase_count integer DEFAULT 0 NOT NULL,
    purchased_at timestamp without time zone,
    location character varying(100),
    warranty_months integer DEFAULT 0,
    status character varying(20) DEFAULT 'active'::character varying,
    image_url text,
    is_featured boolean DEFAULT false,
    supplier_name character varying(150),
    supplier_phone character varying(50),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone,
    is_ecommerce_active boolean DEFAULT true,
    feature_image text,
    deleted_by integer,
    supplier_warranty_expire_date date
);


ALTER TABLE public.products OWNER TO postgres;

--
-- Name: products_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.products_id_seq OWNER TO postgres;

--
-- Name: products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.products_id_seq OWNED BY public.products.id;


--
-- Name: purchase_order_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.purchase_order_items (
    id integer NOT NULL,
    purchase_order_id integer NOT NULL,
    product_id integer NOT NULL,
    quantity integer DEFAULT 0 NOT NULL,
    cost_price numeric(14,2) DEFAULT 0 NOT NULL,
    sale_price numeric(14,2) DEFAULT 0 NOT NULL,
    margin_type character varying(10) DEFAULT 'percent'::character varying NOT NULL,
    margin_value numeric(14,2) DEFAULT 0 NOT NULL,
    final_sale_price numeric(14,2) DEFAULT 0 NOT NULL,
    line_total numeric(14,2) DEFAULT 0 NOT NULL,
    expected_date date,
    warranty_months integer DEFAULT 0,
    sort_order integer DEFAULT 0 NOT NULL,
    supplier_warranty_expire_date date
);


ALTER TABLE public.purchase_order_items OWNER TO postgres;

--
-- Name: purchase_order_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.purchase_order_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.purchase_order_items_id_seq OWNER TO postgres;

--
-- Name: purchase_order_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.purchase_order_items_id_seq OWNED BY public.purchase_order_items.id;


--
-- Name: purchase_order_payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.purchase_order_payments (
    id integer NOT NULL,
    purchase_order_id integer NOT NULL,
    payment_method character varying(40) NOT NULL,
    account_id integer,
    amount numeric(14,2) DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.purchase_order_payments OWNER TO postgres;

--
-- Name: purchase_order_payments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.purchase_order_payments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.purchase_order_payments_id_seq OWNER TO postgres;

--
-- Name: purchase_order_payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.purchase_order_payments_id_seq OWNED BY public.purchase_order_payments.id;


--
-- Name: purchase_order_serials; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.purchase_order_serials (
    id integer NOT NULL,
    purchase_order_item_id integer NOT NULL,
    serial_code character varying(120) NOT NULL
);


ALTER TABLE public.purchase_order_serials OWNER TO postgres;

--
-- Name: purchase_order_serials_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.purchase_order_serials_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.purchase_order_serials_id_seq OWNER TO postgres;

--
-- Name: purchase_order_serials_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.purchase_order_serials_id_seq OWNED BY public.purchase_order_serials.id;


--
-- Name: purchase_orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.purchase_orders (
    id integer NOT NULL,
    po_number character varying(30) NOT NULL,
    supplier_id integer NOT NULL,
    transaction_reference character varying(120),
    extra_cost numeric(14,2) DEFAULT 0 NOT NULL,
    total_cost numeric(14,2) DEFAULT 0 NOT NULL,
    total_sale numeric(14,2) DEFAULT 0 NOT NULL,
    potential_profit numeric(14,2) DEFAULT 0 NOT NULL,
    total_paid numeric(14,2) DEFAULT 0 NOT NULL,
    total_due numeric(14,2) DEFAULT 0 NOT NULL,
    item_count integer DEFAULT 0 NOT NULL,
    unit_count integer DEFAULT 0 NOT NULL,
    status character varying(20) DEFAULT 'saved'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone,
    deleted_by integer
);


ALTER TABLE public.purchase_orders OWNER TO postgres;

--
-- Name: purchase_orders_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.purchase_orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.purchase_orders_id_seq OWNER TO postgres;

--
-- Name: purchase_orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.purchase_orders_id_seq OWNED BY public.purchase_orders.id;


--
-- Name: purchase_quotation_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.purchase_quotation_items (
    id integer NOT NULL,
    quotation_id integer NOT NULL,
    product_id integer,
    quantity integer DEFAULT 1 NOT NULL,
    unit_price numeric(14,2) DEFAULT 0 NOT NULL,
    line_total numeric(14,2) DEFAULT 0 NOT NULL,
    notes text
);


ALTER TABLE public.purchase_quotation_items OWNER TO postgres;

--
-- Name: purchase_quotation_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.purchase_quotation_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.purchase_quotation_items_id_seq OWNER TO postgres;

--
-- Name: purchase_quotation_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.purchase_quotation_items_id_seq OWNED BY public.purchase_quotation_items.id;


--
-- Name: purchase_quotations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.purchase_quotations (
    id integer NOT NULL,
    quotation_no character varying(50) NOT NULL,
    supplier_id integer,
    reference character varying(120),
    quotation_date date DEFAULT CURRENT_DATE,
    valid_until date,
    total_amount numeric(14,2) DEFAULT 0,
    item_count integer DEFAULT 0,
    status character varying(30) DEFAULT 'draft'::character varying,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone,
    deleted_by integer
);


ALTER TABLE public.purchase_quotations OWNER TO postgres;

--
-- Name: purchase_quotations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.purchase_quotations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.purchase_quotations_id_seq OWNER TO postgres;

--
-- Name: purchase_quotations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.purchase_quotations_id_seq OWNED BY public.purchase_quotations.id;


--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.role_permissions (
    role_id integer NOT NULL,
    permission_id integer NOT NULL
);


ALTER TABLE public.role_permissions OWNER TO postgres;

--
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    permissions jsonb DEFAULT '[]'::jsonb
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_id_seq OWNER TO postgres;

--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: sales; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sales (
    id integer NOT NULL,
    invoice_no character varying(50) NOT NULL,
    customer_id integer,
    total_amount numeric(14,2) NOT NULL,
    sale_date timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone,
    loyalty_points_earned numeric(10,2) DEFAULT 0.00,
    loyalty_points_used numeric(10,2) DEFAULT 0.00,
    payment_method_id integer,
    created_at timestamp without time zone DEFAULT now(),
    subtotal numeric(14,2) DEFAULT 0,
    discount numeric(14,2) DEFAULT 0,
    paid_amount numeric(14,2) DEFAULT 0,
    due_amount numeric(14,2) DEFAULT 0,
    payment_status character varying(30) DEFAULT 'paid'::character varying,
    payment_details jsonb,
    vat numeric(15,2) DEFAULT 0.00,
    sales_person character varying(100),
    destination character varying(255),
    attention character varying(255),
    invoice_date date DEFAULT CURRENT_DATE,
    setup_charge numeric(12,2) DEFAULT 0,
    deleted_by integer,
    notes text
);


ALTER TABLE public.sales OWNER TO postgres;

--
-- Name: sales_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sales_id_seq OWNER TO postgres;

--
-- Name: sales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sales_id_seq OWNED BY public.sales.id;


--
-- Name: sales_invoices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sales_invoices (
    id integer NOT NULL,
    invoice_no character varying(30) NOT NULL,
    customer_id integer NOT NULL,
    warehouse_id integer,
    subtotal numeric(14,2) DEFAULT 0 NOT NULL,
    discount numeric(14,2) DEFAULT 0 NOT NULL,
    vat numeric(14,2) DEFAULT 0 NOT NULL,
    grand_total numeric(14,2) DEFAULT 0 NOT NULL,
    paid_amount numeric(14,2) DEFAULT 0 NOT NULL,
    due_amount numeric(14,2) DEFAULT 0 NOT NULL,
    payment_status character varying(20) DEFAULT 'unpaid'::character varying,
    sold_by integer,
    invoice_date date DEFAULT CURRENT_DATE,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.sales_invoices OWNER TO postgres;

--
-- Name: sales_invoices_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sales_invoices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sales_invoices_id_seq OWNER TO postgres;

--
-- Name: sales_invoices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sales_invoices_id_seq OWNED BY public.sales_invoices.id;


--
-- Name: sales_item_serials; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sales_item_serials (
    id integer NOT NULL,
    sales_item_id integer NOT NULL,
    serial_code character varying(120) NOT NULL
);


ALTER TABLE public.sales_item_serials OWNER TO postgres;

--
-- Name: sales_item_serials_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sales_item_serials_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sales_item_serials_id_seq OWNER TO postgres;

--
-- Name: sales_item_serials_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sales_item_serials_id_seq OWNED BY public.sales_item_serials.id;


--
-- Name: sales_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sales_items (
    id integer NOT NULL,
    sales_invoice_id integer,
    product_id integer NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    unit_price numeric(14,2) NOT NULL,
    cost_price numeric(14,2) DEFAULT 0 NOT NULL,
    line_total numeric(14,2) NOT NULL,
    warranty_expire_date date,
    sale_id integer
);


ALTER TABLE public.sales_items OWNER TO postgres;

--
-- Name: sales_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sales_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sales_items_id_seq OWNER TO postgres;

--
-- Name: sales_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sales_items_id_seq OWNED BY public.sales_items.id;


--
-- Name: sales_quotation_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sales_quotation_items (
    id integer NOT NULL,
    quotation_id integer NOT NULL,
    product_id integer,
    product_name character varying(200),
    quantity integer DEFAULT 1 NOT NULL,
    unit_price numeric(14,2) DEFAULT 0 NOT NULL,
    line_total numeric(14,2) DEFAULT 0 NOT NULL,
    warranty_months integer DEFAULT 0
);


ALTER TABLE public.sales_quotation_items OWNER TO postgres;

--
-- Name: sales_quotation_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sales_quotation_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sales_quotation_items_id_seq OWNER TO postgres;

--
-- Name: sales_quotation_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sales_quotation_items_id_seq OWNED BY public.sales_quotation_items.id;


--
-- Name: sales_quotations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sales_quotations (
    id integer NOT NULL,
    quotation_no character varying(50) NOT NULL,
    customer_id integer,
    customer_name character varying(150),
    customer_phone character varying(50),
    customer_address text,
    subtotal numeric(14,2) DEFAULT 0 NOT NULL,
    discount numeric(14,2) DEFAULT 0 NOT NULL,
    vat numeric(14,2) DEFAULT 0 NOT NULL,
    total_amount numeric(14,2) DEFAULT 0 NOT NULL,
    status character varying(30) DEFAULT 'pending'::character varying,
    valid_until date,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone,
    deleted_by integer
);


ALTER TABLE public.sales_quotations OWNER TO postgres;

--
-- Name: sales_quotations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sales_quotations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sales_quotations_id_seq OWNER TO postgres;

--
-- Name: sales_quotations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sales_quotations_id_seq OWNED BY public.sales_quotations.id;


--
-- Name: security_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.security_settings (
    id integer NOT NULL,
    setting_key character varying(100) NOT NULL,
    setting_value text,
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.security_settings OWNER TO postgres;

--
-- Name: security_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.security_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.security_settings_id_seq OWNER TO postgres;

--
-- Name: security_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.security_settings_id_seq OWNED BY public.security_settings.id;


--
-- Name: series; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.series (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    brand_id integer NOT NULL,
    deleted_at timestamp without time zone,
    deleted_by integer
);


ALTER TABLE public.series OWNER TO postgres;

--
-- Name: series_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.series_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.series_id_seq OWNER TO postgres;

--
-- Name: series_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.series_id_seq OWNED BY public.series.id;


--
-- Name: service_projects; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.service_projects (
    id integer NOT NULL,
    project_code character varying(30),
    title character varying(200) NOT NULL,
    customer_id integer,
    assigned_technician integer,
    contract_amount numeric(14,2) DEFAULT 0,
    start_date date,
    deadline date,
    status character varying(30) DEFAULT 'ongoing'::character varying,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    project_type character varying(100),
    technician_id integer,
    charges numeric(14,2) DEFAULT 0,
    description text,
    progress_note text,
    updated_at timestamp without time zone DEFAULT now(),
    invoice_id integer,
    invoice_no character varying(100),
    setup_charge numeric(12,2) DEFAULT 0,
    conveyance_cost numeric(12,2) DEFAULT 0,
    meal_allowance numeric(12,2) DEFAULT 0,
    customer_billing_amount numeric(12,2) DEFAULT 0,
    technician_status character varying(50) DEFAULT 'assigned'::character varying,
    admin_confirmed boolean DEFAULT false,
    confirmed_by integer,
    site_address text,
    site_phone character varying(50),
    equipment_details jsonb,
    completed_at timestamp without time zone,
    deleted_at timestamp without time zone,
    deleted_by integer
);


ALTER TABLE public.service_projects OWNER TO postgres;

--
-- Name: service_projects_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.service_projects_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.service_projects_id_seq OWNER TO postgres;

--
-- Name: service_projects_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.service_projects_id_seq OWNED BY public.service_projects.id;


--
-- Name: shop_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.shop_settings (
    id integer NOT NULL,
    shop_name character varying(150) NOT NULL,
    shop_title character varying(255),
    description text,
    phone character varying(50),
    email character varying(100),
    address text,
    website character varying(255),
    logo_url text,
    banner_url text,
    theme_mode character varying(50) DEFAULT 'colorful'::character varying,
    invoice_template character varying(50) DEFAULT 'standard'::character varying,
    invoice_color_scheme character varying(50) DEFAULT '#1e293b'::character varying,
    loyalty_enabled boolean DEFAULT false,
    loyalty_rate numeric(5,2) DEFAULT 1.00,
    updated_at timestamp without time zone DEFAULT now(),
    branch_name character varying(100) DEFAULT 'Main Branch - Head Office'::character varying,
    alt_phone character varying(50) DEFAULT '+880 1800-000000'::character varying,
    trade_license character varying(100) DEFAULT 'TRAD/DNCC/048219/2024'::character varying,
    bin_tin character varying(100) DEFAULT 'BIN-003948172-0101'::character varying,
    currency_symbol character varying(10) DEFAULT '৳'::character varying,
    timezone character varying(50) DEFAULT 'Asia/Dhaka'::character varying,
    invoice_footer_note text DEFAULT 'ধন্যবাদ! আবার আসবেন। বিক্রিত পণ্য ৩ দিনের মধ্যে পরিবর্তনযোগ্য (শর্ত প্রযোজ্য)।'::text,
    invoice_terms text DEFAULT '১. ক্যাশ মেমো ব্যতীত কোনো ওয়ারেন্টি দাবি গ্রহণযোগ্য নয়。
২. বৈদ্যুতিক গোলযোগ বা বার্নজনিত ক্ষতি ওয়ারেন্টির আওতাভুক্ত নয়。
৩. কাটার পর কোনো তার বা অপটিক্যাল ক্যাবল ফেরত নেওয়া হবে না।'::text,
    show_logo_on_invoice boolean DEFAULT true,
    show_qr_on_invoice boolean DEFAULT true,
    show_signature_on_invoice boolean DEFAULT true,
    default_invoice_format character varying(30) DEFAULT 'thermal_80mm'::character varying,
    barcode_scanner_auto_submit boolean DEFAULT true,
    sound_effects_enabled boolean DEFAULT true,
    low_stock_threshold integer DEFAULT 5,
    negative_stock_allowed boolean DEFAULT false,
    app_language character varying(20) DEFAULT 'bn'::character varying,
    number_format character varying(20) DEFAULT 'lakh'::character varying,
    sms_provider character varying(50) DEFAULT 'greenweb'::character varying,
    sms_api_key character varying(200) DEFAULT 'gw_live_99a8b7c6d5e4f3'::character varying,
    sms_sender_id character varying(50) DEFAULT 'SHEBATECH'::character varying,
    sms_sales_enabled boolean DEFAULT true,
    sms_warranty_enabled boolean DEFAULT true,
    sms_low_stock_enabled boolean DEFAULT false,
    sms_sales_template text DEFAULT 'ধন্যবাদ {customer_name}! আপনার চালান নং #{invoice_no}, মোট {amount} ৳ পরিশোধিত হয়েছে। - {shop_name}'::text,
    sms_warranty_template text DEFAULT 'প্রিয় {customer_name}, আপনার সার্ভিস টোকেন #{warranty_token} এর পণ্য সার্ভিসিং সম্পন্ন হয়েছে। শপে এসে সংগ্রহ করুন।'::text,
    auto_backup_enabled boolean DEFAULT true,
    auto_backup_time character varying(10) DEFAULT '02:00'::character varying,
    session_timeout_minutes integer DEFAULT 30,
    license_key character varying(100) DEFAULT 'SHEBA-ENT-2026-X99-PRO'::character varying,
    license_status character varying(50) DEFAULT 'Active Lifetime Enterprise'::character varying,
    domain_name character varying(100) DEFAULT 'shebatech.com.bd'::character varying,
    domain_expiry character varying(50) DEFAULT '2027-01-15'::character varying,
    ssl_status character varying(50) DEFAULT 'Valid (Let''s Encrypt Wildcard)'::character varying,
    hosting_server character varying(100) DEFAULT 'Ubuntu 24.04 LTS (Dedicated 8 vCPU, 16GB RAM)'::character varying
);


ALTER TABLE public.shop_settings OWNER TO postgres;

--
-- Name: shop_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.shop_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.shop_settings_id_seq OWNER TO postgres;

--
-- Name: shop_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.shop_settings_id_seq OWNED BY public.shop_settings.id;


--
-- Name: sms_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sms_logs (
    id integer NOT NULL,
    trigger_key character varying(100),
    recipient_phone character varying(50) NOT NULL,
    recipient_name character varying(150),
    message_content text NOT NULL,
    sms_count integer DEFAULT 1,
    provider character varying(50) DEFAULT 'greenweb'::character varying,
    gateway_msg_id character varying(100),
    status character varying(50) DEFAULT 'DELIVERED'::character varying,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.sms_logs OWNER TO postgres;

--
-- Name: sms_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sms_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sms_logs_id_seq OWNER TO postgres;

--
-- Name: sms_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sms_logs_id_seq OWNED BY public.sms_logs.id;


--
-- Name: sms_trigger_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sms_trigger_settings (
    id integer NOT NULL,
    trigger_key character varying(100) NOT NULL,
    trigger_name character varying(150) NOT NULL,
    category character varying(50) DEFAULT 'Sales'::character varying,
    recipient_type character varying(50) DEFAULT 'Customer'::character varying,
    is_enabled boolean DEFAULT true,
    template_bn text NOT NULL,
    available_tokens text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.sms_trigger_settings OWNER TO postgres;

--
-- Name: sms_trigger_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sms_trigger_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sms_trigger_settings_id_seq OWNER TO postgres;

--
-- Name: sms_trigger_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sms_trigger_settings_id_seq OWNED BY public.sms_trigger_settings.id;


--
-- Name: stock_levels; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.stock_levels (
    id integer NOT NULL,
    product_id integer NOT NULL,
    warehouse_id integer NOT NULL,
    quantity integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.stock_levels OWNER TO postgres;

--
-- Name: stock_levels_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.stock_levels_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.stock_levels_id_seq OWNER TO postgres;

--
-- Name: stock_levels_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.stock_levels_id_seq OWNED BY public.stock_levels.id;


--
-- Name: stock_transfers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.stock_transfers (
    id integer NOT NULL,
    transfer_no character varying(50) NOT NULL,
    source_warehouse_id integer,
    dest_warehouse_id integer,
    product_id integer,
    quantity integer DEFAULT 1 NOT NULL,
    notes text,
    transfer_date timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.stock_transfers OWNER TO postgres;

--
-- Name: stock_transfers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.stock_transfers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.stock_transfers_id_seq OWNER TO postgres;

--
-- Name: stock_transfers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.stock_transfers_id_seq OWNED BY public.stock_transfers.id;


--
-- Name: sub_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sub_categories (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    category_id integer NOT NULL,
    deleted_at timestamp without time zone,
    deleted_by integer
);


ALTER TABLE public.sub_categories OWNER TO postgres;

--
-- Name: sub_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sub_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sub_categories_id_seq OWNER TO postgres;

--
-- Name: sub_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sub_categories_id_seq OWNED BY public.sub_categories.id;


--
-- Name: suppliers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.suppliers (
    id integer NOT NULL,
    name character varying(150) NOT NULL,
    contact_code character varying(50),
    phone character varying(50),
    payable_balance numeric(14,2) DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    contact_person character varying(100),
    mobile character varying(50),
    email character varying(150),
    address text,
    deleted_at timestamp without time zone,
    deleted_by integer
);


ALTER TABLE public.suppliers OWNER TO postgres;

--
-- Name: suppliers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.suppliers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.suppliers_id_seq OWNER TO postgres;

--
-- Name: suppliers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.suppliers_id_seq OWNED BY public.suppliers.id;


--
-- Name: system_backup_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.system_backup_logs (
    id integer NOT NULL,
    backup_name character varying(200) NOT NULL,
    backup_type character varying(50) DEFAULT 'SQL Dump'::character varying,
    file_size character varying(50) DEFAULT '14.2 MB'::character varying,
    status character varying(50) DEFAULT 'SUCCESS'::character varying,
    created_by character varying(100) DEFAULT 'System Admin'::character varying,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.system_backup_logs OWNER TO postgres;

--
-- Name: system_backup_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.system_backup_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.system_backup_logs_id_seq OWNER TO postgres;

--
-- Name: system_backup_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.system_backup_logs_id_seq OWNED BY public.system_backup_logs.id;


--
-- Name: transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.transactions (
    id integer NOT NULL,
    transaction_no character varying(50) NOT NULL,
    account_id integer,
    payment_method_id integer,
    type character varying(20) NOT NULL,
    amount numeric(14,2) NOT NULL,
    reference_no character varying(50),
    note text,
    created_at timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone
);


ALTER TABLE public.transactions OWNER TO postgres;

--
-- Name: transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.transactions_id_seq OWNER TO postgres;

--
-- Name: transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.transactions_id_seq OWNED BY public.transactions.id;


--
-- Name: trash_records; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.trash_records (
    id integer NOT NULL,
    table_name character varying(50) NOT NULL,
    record_id integer NOT NULL,
    record_data jsonb NOT NULL,
    deleted_by integer,
    deleted_at timestamp without time zone DEFAULT now(),
    record_title character varying(255)
);


ALTER TABLE public.trash_records OWNER TO postgres;

--
-- Name: trash_records_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.trash_records_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.trash_records_id_seq OWNER TO postgres;

--
-- Name: trash_records_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.trash_records_id_seq OWNED BY public.trash_records.id;


--
-- Name: trusted_devices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.trusted_devices (
    id integer NOT NULL,
    device_id character varying(100) NOT NULL,
    device_name character varying(150) NOT NULL,
    user_id integer,
    device_type character varying(50) DEFAULT 'desktop'::character varying,
    browser_info character varying(255),
    ip_address character varying(50),
    is_authorized boolean DEFAULT true,
    last_active timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.trusted_devices OWNER TO postgres;

--
-- Name: trusted_devices_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.trusted_devices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.trusted_devices_id_seq OWNER TO postgres;

--
-- Name: trusted_devices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.trusted_devices_id_seq OWNED BY public.trusted_devices.id;


--
-- Name: units; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.units (
    id integer NOT NULL,
    name character varying(50) NOT NULL
);


ALTER TABLE public.units OWNER TO postgres;

--
-- Name: units_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.units_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.units_id_seq OWNER TO postgres;

--
-- Name: units_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.units_id_seq OWNED BY public.units.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    role_id integer,
    name character varying(100) NOT NULL,
    phone character varying(50),
    email character varying(100),
    password_hash character varying(255) NOT NULL,
    is_active boolean DEFAULT true,
    last_login timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone,
    device_id character varying(100),
    allowed_ip character varying(50),
    is_locked boolean DEFAULT false,
    failed_login_count integer DEFAULT 0,
    role_name character varying(50),
    deleted_by integer,
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: warehouses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.warehouses (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    location text,
    is_default boolean DEFAULT false
);


ALTER TABLE public.warehouses OWNER TO postgres;

--
-- Name: warehouses_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.warehouses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.warehouses_id_seq OWNER TO postgres;

--
-- Name: warehouses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.warehouses_id_seq OWNED BY public.warehouses.id;


--
-- Name: warranty_claims; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.warranty_claims (
    id integer NOT NULL,
    claim_no character varying(50) NOT NULL,
    order_source character varying(20) DEFAULT 'offline'::character varying,
    invoice_no character varying(50),
    ecommerce_order_no character varying(50),
    customer_id integer,
    product_id integer,
    barcode character varying(100),
    issue_description text NOT NULL,
    status character varying(50) DEFAULT 'Received'::character varying,
    claim_date timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone,
    customer_name character varying(150),
    customer_phone character varying(50),
    product_name character varying(255),
    serial_code character varying(100),
    service_notes text,
    replacement_serial_code character varying(100),
    backup_unit_provided character varying(255),
    received_date timestamp without time zone DEFAULT now(),
    estimated_delivery_date date,
    completed_date timestamp without time zone,
    deleted_by integer
);


ALTER TABLE public.warranty_claims OWNER TO postgres;

--
-- Name: warranty_claims_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.warranty_claims_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.warranty_claims_id_seq OWNER TO postgres;

--
-- Name: warranty_claims_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.warranty_claims_id_seq OWNED BY public.warranty_claims.id;


--
-- Name: account_transactions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account_transactions ALTER COLUMN id SET DEFAULT nextval('public.account_transactions_id_seq'::regclass);


--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- Name: brands id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brands ALTER COLUMN id SET DEFAULT nextval('public.brands_id_seq'::regclass);


--
-- Name: business_profiles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.business_profiles ALTER COLUMN id SET DEFAULT nextval('public.business_profiles_id_seq'::regclass);


--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Name: customers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers ALTER COLUMN id SET DEFAULT nextval('public.customers_id_seq'::regclass);


--
-- Name: daily_summaries id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.daily_summaries ALTER COLUMN id SET DEFAULT nextval('public.daily_summaries_id_seq'::regclass);


--
-- Name: damaged_products id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.damaged_products ALTER COLUMN id SET DEFAULT nextval('public.damaged_products_id_seq'::regclass);


--
-- Name: device_sessions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.device_sessions ALTER COLUMN id SET DEFAULT nextval('public.device_sessions_id_seq'::regclass);


--
-- Name: ecommerce_order_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ecommerce_order_items ALTER COLUMN id SET DEFAULT nextval('public.ecommerce_order_items_id_seq'::regclass);


--
-- Name: ecommerce_orders id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ecommerce_orders ALTER COLUMN id SET DEFAULT nextval('public.ecommerce_orders_id_seq'::regclass);


--
-- Name: expense_categories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expense_categories ALTER COLUMN id SET DEFAULT nextval('public.expense_categories_id_seq'::regclass);


--
-- Name: expenses id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses ALTER COLUMN id SET DEFAULT nextval('public.expenses_id_seq'::regclass);


--
-- Name: financial_accounts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.financial_accounts ALTER COLUMN id SET DEFAULT nextval('public.financial_accounts_id_seq'::regclass);


--
-- Name: ip_rules id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ip_rules ALTER COLUMN id SET DEFAULT nextval('public.ip_rules_id_seq'::regclass);


--
-- Name: menu_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.menu_items ALTER COLUMN id SET DEFAULT nextval('public.menu_items_id_seq'::regclass);


--
-- Name: menu_sub_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.menu_sub_items ALTER COLUMN id SET DEFAULT nextval('public.menu_sub_items_id_seq'::regclass);


--
-- Name: models id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.models ALTER COLUMN id SET DEFAULT nextval('public.models_id_seq'::regclass);


--
-- Name: payment_accounts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_accounts ALTER COLUMN id SET DEFAULT nextval('public.payment_accounts_id_seq'::regclass);


--
-- Name: payment_methods id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_methods ALTER COLUMN id SET DEFAULT nextval('public.payment_methods_id_seq'::regclass);


--
-- Name: permissions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions ALTER COLUMN id SET DEFAULT nextval('public.permissions_id_seq'::regclass);


--
-- Name: product_images id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_images ALTER COLUMN id SET DEFAULT nextval('public.product_images_id_seq'::regclass);


--
-- Name: product_names id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_names ALTER COLUMN id SET DEFAULT nextval('public.product_names_id_seq'::regclass);


--
-- Name: product_returns id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_returns ALTER COLUMN id SET DEFAULT nextval('public.product_returns_id_seq'::regclass);


--
-- Name: products id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);


--
-- Name: purchase_order_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_order_items ALTER COLUMN id SET DEFAULT nextval('public.purchase_order_items_id_seq'::regclass);


--
-- Name: purchase_order_payments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_order_payments ALTER COLUMN id SET DEFAULT nextval('public.purchase_order_payments_id_seq'::regclass);


--
-- Name: purchase_order_serials id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_order_serials ALTER COLUMN id SET DEFAULT nextval('public.purchase_order_serials_id_seq'::regclass);


--
-- Name: purchase_orders id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_orders ALTER COLUMN id SET DEFAULT nextval('public.purchase_orders_id_seq'::regclass);


--
-- Name: purchase_quotation_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_quotation_items ALTER COLUMN id SET DEFAULT nextval('public.purchase_quotation_items_id_seq'::regclass);


--
-- Name: purchase_quotations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_quotations ALTER COLUMN id SET DEFAULT nextval('public.purchase_quotations_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: sales id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales ALTER COLUMN id SET DEFAULT nextval('public.sales_id_seq'::regclass);


--
-- Name: sales_invoices id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales_invoices ALTER COLUMN id SET DEFAULT nextval('public.sales_invoices_id_seq'::regclass);


--
-- Name: sales_item_serials id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales_item_serials ALTER COLUMN id SET DEFAULT nextval('public.sales_item_serials_id_seq'::regclass);


--
-- Name: sales_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales_items ALTER COLUMN id SET DEFAULT nextval('public.sales_items_id_seq'::regclass);


--
-- Name: sales_quotation_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales_quotation_items ALTER COLUMN id SET DEFAULT nextval('public.sales_quotation_items_id_seq'::regclass);


--
-- Name: sales_quotations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales_quotations ALTER COLUMN id SET DEFAULT nextval('public.sales_quotations_id_seq'::regclass);


--
-- Name: security_settings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.security_settings ALTER COLUMN id SET DEFAULT nextval('public.security_settings_id_seq'::regclass);


--
-- Name: series id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.series ALTER COLUMN id SET DEFAULT nextval('public.series_id_seq'::regclass);


--
-- Name: service_projects id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_projects ALTER COLUMN id SET DEFAULT nextval('public.service_projects_id_seq'::regclass);


--
-- Name: shop_settings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shop_settings ALTER COLUMN id SET DEFAULT nextval('public.shop_settings_id_seq'::regclass);


--
-- Name: sms_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sms_logs ALTER COLUMN id SET DEFAULT nextval('public.sms_logs_id_seq'::regclass);


--
-- Name: sms_trigger_settings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sms_trigger_settings ALTER COLUMN id SET DEFAULT nextval('public.sms_trigger_settings_id_seq'::regclass);


--
-- Name: stock_levels id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_levels ALTER COLUMN id SET DEFAULT nextval('public.stock_levels_id_seq'::regclass);


--
-- Name: stock_transfers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_transfers ALTER COLUMN id SET DEFAULT nextval('public.stock_transfers_id_seq'::regclass);


--
-- Name: sub_categories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sub_categories ALTER COLUMN id SET DEFAULT nextval('public.sub_categories_id_seq'::regclass);


--
-- Name: suppliers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.suppliers ALTER COLUMN id SET DEFAULT nextval('public.suppliers_id_seq'::regclass);


--
-- Name: system_backup_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_backup_logs ALTER COLUMN id SET DEFAULT nextval('public.system_backup_logs_id_seq'::regclass);


--
-- Name: transactions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions ALTER COLUMN id SET DEFAULT nextval('public.transactions_id_seq'::regclass);


--
-- Name: trash_records id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trash_records ALTER COLUMN id SET DEFAULT nextval('public.trash_records_id_seq'::regclass);


--
-- Name: trusted_devices id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trusted_devices ALTER COLUMN id SET DEFAULT nextval('public.trusted_devices_id_seq'::regclass);


--
-- Name: units id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.units ALTER COLUMN id SET DEFAULT nextval('public.units_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: warehouses id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.warehouses ALTER COLUMN id SET DEFAULT nextval('public.warehouses_id_seq'::regclass);


--
-- Name: warranty_claims id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.warranty_claims ALTER COLUMN id SET DEFAULT nextval('public.warranty_claims_id_seq'::regclass);


--
-- Name: account_transactions account_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account_transactions
    ADD CONSTRAINT account_transactions_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: brands brands_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brands
    ADD CONSTRAINT brands_name_key UNIQUE (name);


--
-- Name: brands brands_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brands
    ADD CONSTRAINT brands_pkey PRIMARY KEY (id);


--
-- Name: business_profiles business_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.business_profiles
    ADD CONSTRAINT business_profiles_pkey PRIMARY KEY (id);


--
-- Name: categories categories_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key UNIQUE (name);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: customers customers_phone_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_phone_key UNIQUE (phone);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: daily_summaries daily_summaries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.daily_summaries
    ADD CONSTRAINT daily_summaries_pkey PRIMARY KEY (id);


--
-- Name: daily_summaries daily_summaries_summary_date_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.daily_summaries
    ADD CONSTRAINT daily_summaries_summary_date_key UNIQUE (summary_date);


--
-- Name: damaged_products damaged_products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.damaged_products
    ADD CONSTRAINT damaged_products_pkey PRIMARY KEY (id);


--
-- Name: device_sessions device_sessions_device_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.device_sessions
    ADD CONSTRAINT device_sessions_device_id_key UNIQUE (device_id);


--
-- Name: device_sessions device_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.device_sessions
    ADD CONSTRAINT device_sessions_pkey PRIMARY KEY (id);


--
-- Name: ecommerce_order_items ecommerce_order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ecommerce_order_items
    ADD CONSTRAINT ecommerce_order_items_pkey PRIMARY KEY (id);


--
-- Name: ecommerce_orders ecommerce_orders_order_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ecommerce_orders
    ADD CONSTRAINT ecommerce_orders_order_number_key UNIQUE (order_number);


--
-- Name: ecommerce_orders ecommerce_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ecommerce_orders
    ADD CONSTRAINT ecommerce_orders_pkey PRIMARY KEY (id);


--
-- Name: expense_categories expense_categories_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expense_categories
    ADD CONSTRAINT expense_categories_name_key UNIQUE (name);


--
-- Name: expense_categories expense_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expense_categories
    ADD CONSTRAINT expense_categories_pkey PRIMARY KEY (id);


--
-- Name: expenses expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_pkey PRIMARY KEY (id);


--
-- Name: financial_accounts financial_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.financial_accounts
    ADD CONSTRAINT financial_accounts_pkey PRIMARY KEY (id);


--
-- Name: ip_rules ip_rules_ip_address_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ip_rules
    ADD CONSTRAINT ip_rules_ip_address_key UNIQUE (ip_address);


--
-- Name: ip_rules ip_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ip_rules
    ADD CONSTRAINT ip_rules_pkey PRIMARY KEY (id);


--
-- Name: menu_items menu_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.menu_items
    ADD CONSTRAINT menu_items_pkey PRIMARY KEY (id);


--
-- Name: menu_items menu_items_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.menu_items
    ADD CONSTRAINT menu_items_slug_key UNIQUE (slug);


--
-- Name: menu_sub_items menu_sub_items_menu_item_id_label_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.menu_sub_items
    ADD CONSTRAINT menu_sub_items_menu_item_id_label_key UNIQUE (menu_item_id, label);


--
-- Name: menu_sub_items menu_sub_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.menu_sub_items
    ADD CONSTRAINT menu_sub_items_pkey PRIMARY KEY (id);


--
-- Name: models models_name_brand_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.models
    ADD CONSTRAINT models_name_brand_id_key UNIQUE (name, brand_id);


--
-- Name: models models_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.models
    ADD CONSTRAINT models_pkey PRIMARY KEY (id);


--
-- Name: payment_accounts payment_accounts_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_accounts
    ADD CONSTRAINT payment_accounts_name_key UNIQUE (name);


--
-- Name: payment_accounts payment_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_accounts
    ADD CONSTRAINT payment_accounts_pkey PRIMARY KEY (id);


--
-- Name: payment_methods payment_methods_method_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_methods
    ADD CONSTRAINT payment_methods_method_name_key UNIQUE (method_name);


--
-- Name: payment_methods payment_methods_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_methods
    ADD CONSTRAINT payment_methods_pkey PRIMARY KEY (id);


--
-- Name: permissions permissions_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_code_key UNIQUE (code);


--
-- Name: permissions permissions_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_name_key UNIQUE (name);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: product_images product_images_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_images
    ADD CONSTRAINT product_images_pkey PRIMARY KEY (id);


--
-- Name: product_names product_names_name_brand_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_names
    ADD CONSTRAINT product_names_name_brand_id_key UNIQUE (name, brand_id);


--
-- Name: product_names product_names_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_names
    ADD CONSTRAINT product_names_pkey PRIMARY KEY (id);


--
-- Name: product_returns product_returns_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_returns
    ADD CONSTRAINT product_returns_pkey PRIMARY KEY (id);


--
-- Name: product_returns product_returns_return_no_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_returns
    ADD CONSTRAINT product_returns_return_no_key UNIQUE (return_no);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: purchase_order_items purchase_order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_order_items
    ADD CONSTRAINT purchase_order_items_pkey PRIMARY KEY (id);


--
-- Name: purchase_order_payments purchase_order_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_order_payments
    ADD CONSTRAINT purchase_order_payments_pkey PRIMARY KEY (id);


--
-- Name: purchase_order_serials purchase_order_serials_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_order_serials
    ADD CONSTRAINT purchase_order_serials_pkey PRIMARY KEY (id);


--
-- Name: purchase_order_serials purchase_order_serials_serial_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_order_serials
    ADD CONSTRAINT purchase_order_serials_serial_code_key UNIQUE (serial_code);


--
-- Name: purchase_orders purchase_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_pkey PRIMARY KEY (id);


--
-- Name: purchase_orders purchase_orders_po_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_po_number_key UNIQUE (po_number);


--
-- Name: purchase_quotation_items purchase_quotation_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_quotation_items
    ADD CONSTRAINT purchase_quotation_items_pkey PRIMARY KEY (id);


--
-- Name: purchase_quotations purchase_quotations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_quotations
    ADD CONSTRAINT purchase_quotations_pkey PRIMARY KEY (id);


--
-- Name: purchase_quotations purchase_quotations_quotation_no_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_quotations
    ADD CONSTRAINT purchase_quotations_quotation_no_key UNIQUE (quotation_no);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (role_id, permission_id);


--
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: sales sales_invoice_no_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_invoice_no_key UNIQUE (invoice_no);


--
-- Name: sales_invoices sales_invoices_invoice_no_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales_invoices
    ADD CONSTRAINT sales_invoices_invoice_no_key UNIQUE (invoice_no);


--
-- Name: sales_invoices sales_invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales_invoices
    ADD CONSTRAINT sales_invoices_pkey PRIMARY KEY (id);


--
-- Name: sales_item_serials sales_item_serials_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales_item_serials
    ADD CONSTRAINT sales_item_serials_pkey PRIMARY KEY (id);


--
-- Name: sales_items sales_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales_items
    ADD CONSTRAINT sales_items_pkey PRIMARY KEY (id);


--
-- Name: sales sales_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_pkey PRIMARY KEY (id);


--
-- Name: sales_quotation_items sales_quotation_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales_quotation_items
    ADD CONSTRAINT sales_quotation_items_pkey PRIMARY KEY (id);


--
-- Name: sales_quotations sales_quotations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales_quotations
    ADD CONSTRAINT sales_quotations_pkey PRIMARY KEY (id);


--
-- Name: sales_quotations sales_quotations_quotation_no_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales_quotations
    ADD CONSTRAINT sales_quotations_quotation_no_key UNIQUE (quotation_no);


--
-- Name: security_settings security_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.security_settings
    ADD CONSTRAINT security_settings_pkey PRIMARY KEY (id);


--
-- Name: security_settings security_settings_setting_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.security_settings
    ADD CONSTRAINT security_settings_setting_key_key UNIQUE (setting_key);


--
-- Name: series series_name_brand_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.series
    ADD CONSTRAINT series_name_brand_id_key UNIQUE (name, brand_id);


--
-- Name: series series_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.series
    ADD CONSTRAINT series_pkey PRIMARY KEY (id);


--
-- Name: service_projects service_projects_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_projects
    ADD CONSTRAINT service_projects_pkey PRIMARY KEY (id);


--
-- Name: service_projects service_projects_project_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_projects
    ADD CONSTRAINT service_projects_project_code_key UNIQUE (project_code);


--
-- Name: shop_settings shop_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shop_settings
    ADD CONSTRAINT shop_settings_pkey PRIMARY KEY (id);


--
-- Name: sms_logs sms_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sms_logs
    ADD CONSTRAINT sms_logs_pkey PRIMARY KEY (id);


--
-- Name: sms_trigger_settings sms_trigger_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sms_trigger_settings
    ADD CONSTRAINT sms_trigger_settings_pkey PRIMARY KEY (id);


--
-- Name: sms_trigger_settings sms_trigger_settings_trigger_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sms_trigger_settings
    ADD CONSTRAINT sms_trigger_settings_trigger_key_key UNIQUE (trigger_key);


--
-- Name: stock_levels stock_levels_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_levels
    ADD CONSTRAINT stock_levels_pkey PRIMARY KEY (id);


--
-- Name: stock_levels stock_levels_product_id_warehouse_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_levels
    ADD CONSTRAINT stock_levels_product_id_warehouse_id_key UNIQUE (product_id, warehouse_id);


--
-- Name: stock_transfers stock_transfers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_transfers
    ADD CONSTRAINT stock_transfers_pkey PRIMARY KEY (id);


--
-- Name: stock_transfers stock_transfers_transfer_no_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_transfers
    ADD CONSTRAINT stock_transfers_transfer_no_key UNIQUE (transfer_no);


--
-- Name: sub_categories sub_categories_name_category_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sub_categories
    ADD CONSTRAINT sub_categories_name_category_id_key UNIQUE (name, category_id);


--
-- Name: sub_categories sub_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sub_categories
    ADD CONSTRAINT sub_categories_pkey PRIMARY KEY (id);


--
-- Name: suppliers suppliers_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_email_key UNIQUE (email);


--
-- Name: suppliers suppliers_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_name_key UNIQUE (name);


--
-- Name: suppliers suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_pkey PRIMARY KEY (id);


--
-- Name: system_backup_logs system_backup_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_backup_logs
    ADD CONSTRAINT system_backup_logs_pkey PRIMARY KEY (id);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- Name: transactions transactions_transaction_no_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_transaction_no_key UNIQUE (transaction_no);


--
-- Name: trash_records trash_records_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trash_records
    ADD CONSTRAINT trash_records_pkey PRIMARY KEY (id);


--
-- Name: trusted_devices trusted_devices_device_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trusted_devices
    ADD CONSTRAINT trusted_devices_device_id_key UNIQUE (device_id);


--
-- Name: trusted_devices trusted_devices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trusted_devices
    ADD CONSTRAINT trusted_devices_pkey PRIMARY KEY (id);


--
-- Name: categories unique_category_name; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT unique_category_name UNIQUE (name);


--
-- Name: products unique_product_sku; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT unique_product_sku UNIQUE (sku);


--
-- Name: units units_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.units
    ADD CONSTRAINT units_name_key UNIQUE (name);


--
-- Name: units units_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.units
    ADD CONSTRAINT units_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: warehouses warehouses_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.warehouses
    ADD CONSTRAINT warehouses_name_key UNIQUE (name);


--
-- Name: warehouses warehouses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.warehouses
    ADD CONSTRAINT warehouses_pkey PRIMARY KEY (id);


--
-- Name: warranty_claims warranty_claims_claim_no_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.warranty_claims
    ADD CONSTRAINT warranty_claims_claim_no_key UNIQUE (claim_no);


--
-- Name: warranty_claims warranty_claims_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.warranty_claims
    ADD CONSTRAINT warranty_claims_pkey PRIMARY KEY (id);


--
-- Name: idx_account_transactions_account_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_account_transactions_account_id ON public.account_transactions USING btree (account_id);


--
-- Name: idx_account_transactions_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_account_transactions_created_at ON public.account_transactions USING btree (created_at DESC);


--
-- Name: idx_account_transactions_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_account_transactions_type ON public.account_transactions USING btree (type);


--
-- Name: idx_customers_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_customers_name ON public.customers USING btree (name);


--
-- Name: idx_customers_phone; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_customers_phone ON public.customers USING btree (phone);


--
-- Name: idx_menu_items_sort; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_menu_items_sort ON public.menu_items USING btree (sort_order);


--
-- Name: idx_menu_sub_items_parent; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_menu_sub_items_parent ON public.menu_sub_items USING btree (menu_item_id, sort_order);


--
-- Name: idx_po_supp; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_po_supp ON public.purchase_orders USING btree (supplier_id, created_at DESC);


--
-- Name: idx_product_names_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_product_names_unique ON public.product_names USING btree (name, COALESCE(brand_id, 0));


--
-- Name: idx_products_barcode; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_barcode ON public.products USING btree (barcode);


--
-- Name: idx_products_brand_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_brand_id ON public.products USING btree (brand_id);


--
-- Name: idx_products_category_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_category_id ON public.products USING btree (category_id);


--
-- Name: idx_products_model_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_model_id ON public.products USING btree (model_id);


--
-- Name: idx_products_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_name ON public.products USING btree (name);


--
-- Name: idx_products_sku; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_sku ON public.products USING btree (sku);


--
-- Name: idx_products_stock; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_stock ON public.products USING btree (stock);


--
-- Name: idx_products_sub_category_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_sub_category_id ON public.products USING btree (sub_category_id);


--
-- Name: idx_purchase_order_items_order; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_purchase_order_items_order ON public.purchase_order_items USING btree (purchase_order_id);


--
-- Name: idx_purchase_order_items_po_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_purchase_order_items_po_id ON public.purchase_order_items USING btree (purchase_order_id);


--
-- Name: idx_purchase_order_items_product_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_purchase_order_items_product_id ON public.purchase_order_items USING btree (product_id);


--
-- Name: idx_purchase_order_payments_order; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_purchase_order_payments_order ON public.purchase_order_payments USING btree (purchase_order_id);


--
-- Name: idx_purchase_orders_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_purchase_orders_created_at ON public.purchase_orders USING btree (created_at DESC);


--
-- Name: idx_purchase_orders_po_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_purchase_orders_po_number ON public.purchase_orders USING btree (po_number);


--
-- Name: idx_purchase_orders_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_purchase_orders_status ON public.purchase_orders USING btree (status);


--
-- Name: idx_purchase_orders_supplier; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_purchase_orders_supplier ON public.purchase_orders USING btree (supplier_id, created_at DESC);


--
-- Name: idx_purchase_orders_supplier_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_purchase_orders_supplier_id ON public.purchase_orders USING btree (supplier_id);


--
-- Name: idx_sales_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sales_created_at ON public.sales USING btree (created_at DESC);


--
-- Name: idx_sales_customer_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sales_customer_id ON public.sales USING btree (customer_id);


--
-- Name: idx_sales_inv_cust; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sales_inv_cust ON public.sales_invoices USING btree (customer_id, invoice_date DESC);


--
-- Name: idx_sales_invoice_no; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sales_invoice_no ON public.sales USING btree (invoice_no);


--
-- Name: idx_sales_items_product_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sales_items_product_id ON public.sales_items USING btree (product_id);


--
-- Name: idx_sales_items_sale_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sales_items_sale_id ON public.sales_items USING btree (sale_id);


--
-- Name: idx_sales_payment_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sales_payment_status ON public.sales USING btree (payment_status);


--
-- Name: idx_service_projects_admin_confirmed; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_service_projects_admin_confirmed ON public.service_projects USING btree (admin_confirmed);


--
-- Name: idx_service_projects_invoice_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_service_projects_invoice_id ON public.service_projects USING btree (invoice_id);


--
-- Name: idx_service_projects_tech_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_service_projects_tech_status ON public.service_projects USING btree (technician_status);


--
-- Name: idx_stock_prod_wh; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_stock_prod_wh ON public.stock_levels USING btree (product_id, warehouse_id);


--
-- Name: idx_suppliers_mobile; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_suppliers_mobile ON public.suppliers USING btree (mobile);


--
-- Name: idx_suppliers_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_suppliers_name ON public.suppliers USING btree (name);


--
-- Name: idx_suppliers_phone; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_suppliers_phone ON public.suppliers USING btree (phone);


--
-- Name: account_transactions account_transactions_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account_transactions
    ADD CONSTRAINT account_transactions_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.payment_accounts(id) ON DELETE RESTRICT;


--
-- Name: damaged_products damaged_products_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.damaged_products
    ADD CONSTRAINT damaged_products_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: ecommerce_order_items ecommerce_order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ecommerce_order_items
    ADD CONSTRAINT ecommerce_order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.ecommerce_orders(id) ON DELETE CASCADE;


--
-- Name: ecommerce_order_items ecommerce_order_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ecommerce_order_items
    ADD CONSTRAINT ecommerce_order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE RESTRICT;


--
-- Name: expenses expenses_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.payment_accounts(id) ON DELETE RESTRICT;


--
-- Name: expenses expenses_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.expense_categories(id) ON DELETE SET NULL;


--
-- Name: expenses expenses_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: menu_sub_items fk_menu_sub_items_parent; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.menu_sub_items
    ADD CONSTRAINT fk_menu_sub_items_parent FOREIGN KEY (menu_item_id) REFERENCES public.menu_items(id) ON DELETE CASCADE;


--
-- Name: models fk_models_brand; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.models
    ADD CONSTRAINT fk_models_brand FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;


--
-- Name: models fk_models_category; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.models
    ADD CONSTRAINT fk_models_category FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;


--
-- Name: models fk_models_sub_category; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.models
    ADD CONSTRAINT fk_models_sub_category FOREIGN KEY (sub_category_id) REFERENCES public.sub_categories(id) ON DELETE SET NULL;


--
-- Name: purchase_order_items fk_po_items_order; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_order_items
    ADD CONSTRAINT fk_po_items_order FOREIGN KEY (purchase_order_id) REFERENCES public.purchase_orders(id) ON DELETE CASCADE;


--
-- Name: purchase_order_items fk_po_items_product; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_order_items
    ADD CONSTRAINT fk_po_items_product FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: purchase_order_payments fk_po_payments_account; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_order_payments
    ADD CONSTRAINT fk_po_payments_account FOREIGN KEY (account_id) REFERENCES public.payment_accounts(id);


--
-- Name: purchase_order_payments fk_po_payments_order; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_order_payments
    ADD CONSTRAINT fk_po_payments_order FOREIGN KEY (purchase_order_id) REFERENCES public.purchase_orders(id) ON DELETE CASCADE;


--
-- Name: purchase_order_serials fk_po_serials_item; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_order_serials
    ADD CONSTRAINT fk_po_serials_item FOREIGN KEY (purchase_order_item_id) REFERENCES public.purchase_order_items(id) ON DELETE CASCADE;


--
-- Name: product_images fk_product_images_product; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_images
    ADD CONSTRAINT fk_product_images_product FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: products fk_products_brand; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT fk_products_brand FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE SET NULL;


--
-- Name: products fk_products_category; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;


--
-- Name: products fk_products_model; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT fk_products_model FOREIGN KEY (model_id) REFERENCES public.models(id) ON DELETE SET NULL;


--
-- Name: products fk_products_series; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT fk_products_series FOREIGN KEY (series_id) REFERENCES public.series(id) ON DELETE SET NULL;


--
-- Name: products fk_products_sub_category; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT fk_products_sub_category FOREIGN KEY (sub_category_id) REFERENCES public.sub_categories(id) ON DELETE SET NULL;


--
-- Name: purchase_orders fk_purchase_orders_supplier; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT fk_purchase_orders_supplier FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);


--
-- Name: series fk_series_brand; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.series
    ADD CONSTRAINT fk_series_brand FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;


--
-- Name: sub_categories fk_sub_categories_category; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sub_categories
    ADD CONSTRAINT fk_sub_categories_category FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;


--
-- Name: ip_rules ip_rules_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ip_rules
    ADD CONSTRAINT ip_rules_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: product_names product_names_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_names
    ADD CONSTRAINT product_names_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE SET NULL;


--
-- Name: product_names product_names_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_names
    ADD CONSTRAINT product_names_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;


--
-- Name: product_names product_names_sub_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_names
    ADD CONSTRAINT product_names_sub_category_id_fkey FOREIGN KEY (sub_category_id) REFERENCES public.sub_categories(id) ON DELETE SET NULL;


--
-- Name: product_returns product_returns_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_returns
    ADD CONSTRAINT product_returns_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: product_returns product_returns_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_returns
    ADD CONSTRAINT product_returns_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: purchase_quotation_items purchase_quotation_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_quotation_items
    ADD CONSTRAINT purchase_quotation_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;


--
-- Name: purchase_quotation_items purchase_quotation_items_quotation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_quotation_items
    ADD CONSTRAINT purchase_quotation_items_quotation_id_fkey FOREIGN KEY (quotation_id) REFERENCES public.purchase_quotations(id) ON DELETE CASCADE;


--
-- Name: purchase_quotations purchase_quotations_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_quotations
    ADD CONSTRAINT purchase_quotations_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE SET NULL;


--
-- Name: role_permissions role_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: sales_invoices sales_invoices_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales_invoices
    ADD CONSTRAINT sales_invoices_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE RESTRICT;


--
-- Name: sales_invoices sales_invoices_sold_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales_invoices
    ADD CONSTRAINT sales_invoices_sold_by_fkey FOREIGN KEY (sold_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: sales_invoices sales_invoices_warehouse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales_invoices
    ADD CONSTRAINT sales_invoices_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id) ON DELETE RESTRICT;


--
-- Name: sales_item_serials sales_item_serials_sales_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales_item_serials
    ADD CONSTRAINT sales_item_serials_sales_item_id_fkey FOREIGN KEY (sales_item_id) REFERENCES public.sales_items(id) ON DELETE CASCADE;


--
-- Name: sales_items sales_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales_items
    ADD CONSTRAINT sales_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE RESTRICT;


--
-- Name: sales_items sales_items_sales_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales_items
    ADD CONSTRAINT sales_items_sales_invoice_id_fkey FOREIGN KEY (sales_invoice_id) REFERENCES public.sales_invoices(id) ON DELETE CASCADE;


--
-- Name: sales sales_payment_method_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_payment_method_id_fkey FOREIGN KEY (payment_method_id) REFERENCES public.payment_methods(id);


--
-- Name: sales_quotation_items sales_quotation_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales_quotation_items
    ADD CONSTRAINT sales_quotation_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;


--
-- Name: sales_quotation_items sales_quotation_items_quotation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales_quotation_items
    ADD CONSTRAINT sales_quotation_items_quotation_id_fkey FOREIGN KEY (quotation_id) REFERENCES public.sales_quotations(id) ON DELETE CASCADE;


--
-- Name: sales_quotations sales_quotations_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales_quotations
    ADD CONSTRAINT sales_quotations_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;


--
-- Name: service_projects service_projects_assigned_technician_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_projects
    ADD CONSTRAINT service_projects_assigned_technician_fkey FOREIGN KEY (assigned_technician) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: service_projects service_projects_confirmed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_projects
    ADD CONSTRAINT service_projects_confirmed_by_fkey FOREIGN KEY (confirmed_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: service_projects service_projects_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_projects
    ADD CONSTRAINT service_projects_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;


--
-- Name: service_projects service_projects_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_projects
    ADD CONSTRAINT service_projects_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.sales(id) ON DELETE SET NULL;


--
-- Name: stock_levels stock_levels_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_levels
    ADD CONSTRAINT stock_levels_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: stock_levels stock_levels_warehouse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_levels
    ADD CONSTRAINT stock_levels_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id) ON DELETE CASCADE;


--
-- Name: stock_transfers stock_transfers_dest_warehouse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_transfers
    ADD CONSTRAINT stock_transfers_dest_warehouse_id_fkey FOREIGN KEY (dest_warehouse_id) REFERENCES public.warehouses(id) ON DELETE RESTRICT;


--
-- Name: stock_transfers stock_transfers_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_transfers
    ADD CONSTRAINT stock_transfers_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE RESTRICT;


--
-- Name: stock_transfers stock_transfers_source_warehouse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_transfers
    ADD CONSTRAINT stock_transfers_source_warehouse_id_fkey FOREIGN KEY (source_warehouse_id) REFERENCES public.warehouses(id) ON DELETE RESTRICT;


--
-- Name: transactions transactions_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.financial_accounts(id);


--
-- Name: transactions transactions_payment_method_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_payment_method_id_fkey FOREIGN KEY (payment_method_id) REFERENCES public.payment_methods(id);


--
-- Name: trash_records trash_records_deleted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trash_records
    ADD CONSTRAINT trash_records_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: trusted_devices trusted_devices_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trusted_devices
    ADD CONSTRAINT trusted_devices_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: users users_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE SET NULL;


--
-- Name: warranty_claims warranty_claims_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.warranty_claims
    ADD CONSTRAINT warranty_claims_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: warranty_claims warranty_claims_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.warranty_claims
    ADD CONSTRAINT warranty_claims_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;
GRANT ALL ON SCHEMA public TO PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict Pwc6dfDvpsHbroxaqR1PzM7UuqRtXq4HPvxLfUat55ylUtprUXQTHamTvAtUJXI

