SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- \restrict p5wlgHyaY2eHGYwMfhRFUFD1oihZblyKvmGYajPbYUZedaOBYPGirau3IegW0JN

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

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
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."audit_log_entries" ("instance_id", "id", "payload", "created_at", "ip_address") FROM stdin;
\.


--
-- Data for Name: custom_oauth_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."custom_oauth_providers" ("id", "provider_type", "identifier", "name", "client_id", "client_secret", "acceptable_client_ids", "scopes", "pkce_enabled", "attribute_mapping", "authorization_params", "enabled", "email_optional", "issuer", "discovery_url", "skip_nonce_check", "cached_discovery", "discovery_cached_at", "authorization_url", "token_url", "userinfo_url", "jwks_uri", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."flow_state" ("id", "user_id", "auth_code", "code_challenge_method", "code_challenge", "provider_type", "provider_access_token", "provider_refresh_token", "created_at", "updated_at", "authentication_method", "auth_code_issued_at", "invite_token", "referrer", "oauth_client_state_id", "linking_target_id", "email_optional") FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") FROM stdin;
00000000-0000-0000-0000-000000000000	6598d5b2-cde1-420d-abf4-5ea45cbcfeab	authenticated	authenticated	hdtransportravel@gmail.com	$2a$10$E6RI.TBSvIVcsnE8V2qP4eaAZNmRcQbVTQhDBZ.3RxYJDgdYzU4OC	2026-03-28 13:33:23.346051+00	\N		\N		\N			\N	\N	{"provider": "email", "providers": ["email"]}	{"email_verified": true}	\N	2026-03-28 13:33:23.330576+00	2026-03-28 13:33:23.347386+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	e30f37e3-e82a-4128-85c6-0ca7a606e3f3	authenticated	authenticated	manager.hdtransport@gmail.com	$2a$10$cyuDWjFVMHTr7JE6WLwE/uszpIO06ymvUeLphpaSEpISlNKH4QOoG	2026-03-28 13:41:05.919554+00	\N		\N		\N			\N	\N	{"provider": "email", "providers": ["email"]}	{"email_verified": true}	\N	2026-03-28 13:41:05.90177+00	2026-03-28 13:41:05.922055+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	7ec64b10-d21f-4853-b9b8-3fc35b7ae5b5	authenticated	authenticated	sales.hdtransport@gmail.com	$2a$10$LR/FK4.PNrvPTh3zOaREIOBTC4eHlLmA8Nc1R77Cxb9USzKFPZVZ2	2026-03-28 13:03:47.107552+00	\N		\N		\N			\N	2026-03-28 13:30:53.328758+00	{"provider": "email", "providers": ["email"]}	{"email_verified": true}	\N	2026-03-28 13:03:47.104466+00	2026-03-28 13:30:53.368488+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	853c53ba-58cf-4bdc-a8a0-bee7678f4e30	authenticated	authenticated	operator.hdtransport@gmail.com	$2a$10$kbpXpiYFufKbDyYwbyeaH./p50lQllpK6KzYQX2.MpcNxnjNrme.6	2026-03-28 13:04:52.93556+00	\N		\N		\N			\N	2026-03-28 13:31:28.119152+00	{"provider": "email", "providers": ["email"]}	{"email_verified": true}	\N	2026-03-28 13:04:52.930171+00	2026-03-28 13:31:28.131928+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	dc70628c-8f07-4b11-a0f5-7625e351c024	authenticated	authenticated	accountant.hdtransport@gmail.com	$2a$10$SeAE4I/artU/aGneD.1/5OhoLsogeF/pl5uxdcnbgRaZIw.2bsLMG	2026-03-28 13:04:20.536563+00	\N		\N		\N			\N	2026-03-28 13:32:08.876708+00	{"provider": "email", "providers": ["email"]}	{"email_verified": true}	\N	2026-03-28 13:04:20.524992+00	2026-03-28 13:32:08.90639+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	886df54c-0680-43d4-b312-fe22adc7554c	authenticated	authenticated	admin.hdtransport@gmail.com	$2a$10$rmbHo9GbfasFNESRHmD.mO5jY1iUtSBh/xinQ5OpFsOavOg/lSjy.	2026-03-24 14:01:03.951211+00	\N		\N		\N			\N	2026-03-28 16:55:55.242059+00	{"provider": "email", "providers": ["email"]}	{"email_verified": true}	\N	2026-03-24 14:01:03.911041+00	2026-03-28 16:55:55.291063+00	\N	\N			\N		0	\N		\N	f	\N	f
\.


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") FROM stdin;
886df54c-0680-43d4-b312-fe22adc7554c	886df54c-0680-43d4-b312-fe22adc7554c	{"sub": "886df54c-0680-43d4-b312-fe22adc7554c", "email": "admin.hdtransport@gmail.com", "email_verified": false, "phone_verified": false}	email	2026-03-24 14:01:03.92458+00	2026-03-24 14:01:03.925029+00	2026-03-24 14:01:03.925029+00	9c66383e-dae6-4cec-8d94-1dafb024fed1
7ec64b10-d21f-4853-b9b8-3fc35b7ae5b5	7ec64b10-d21f-4853-b9b8-3fc35b7ae5b5	{"sub": "7ec64b10-d21f-4853-b9b8-3fc35b7ae5b5", "email": "sales.hdtransport@gmail.com", "email_verified": false, "phone_verified": false}	email	2026-03-28 13:03:47.105998+00	2026-03-28 13:03:47.106057+00	2026-03-28 13:03:47.106057+00	02ff44f2-d588-4617-90f5-9b89b40443cb
dc70628c-8f07-4b11-a0f5-7625e351c024	dc70628c-8f07-4b11-a0f5-7625e351c024	{"sub": "dc70628c-8f07-4b11-a0f5-7625e351c024", "email": "accountant.hdtransport@gmail.com", "email_verified": false, "phone_verified": false}	email	2026-03-28 13:04:20.534371+00	2026-03-28 13:04:20.534425+00	2026-03-28 13:04:20.534425+00	b116043f-4b27-41e2-b247-2ce0d519e997
853c53ba-58cf-4bdc-a8a0-bee7678f4e30	853c53ba-58cf-4bdc-a8a0-bee7678f4e30	{"sub": "853c53ba-58cf-4bdc-a8a0-bee7678f4e30", "email": "operator.hdtransport@gmail.com", "email_verified": false, "phone_verified": false}	email	2026-03-28 13:04:52.933257+00	2026-03-28 13:04:52.93331+00	2026-03-28 13:04:52.93331+00	f73fe02f-41ca-47c2-9509-0922211341cd
6598d5b2-cde1-420d-abf4-5ea45cbcfeab	6598d5b2-cde1-420d-abf4-5ea45cbcfeab	{"sub": "6598d5b2-cde1-420d-abf4-5ea45cbcfeab", "email": "hdtransportravel@gmail.com", "email_verified": false, "phone_verified": false}	email	2026-03-28 13:33:23.340488+00	2026-03-28 13:33:23.340543+00	2026-03-28 13:33:23.340543+00	8fde3346-6252-4c93-89a1-bcf948f35f31
e30f37e3-e82a-4128-85c6-0ca7a606e3f3	e30f37e3-e82a-4128-85c6-0ca7a606e3f3	{"sub": "e30f37e3-e82a-4128-85c6-0ca7a606e3f3", "email": "manager.hdtransport@gmail.com", "email_verified": false, "phone_verified": false}	email	2026-03-28 13:41:05.908192+00	2026-03-28 13:41:05.908256+00	2026-03-28 13:41:05.908256+00	3864e7c5-c786-40d9-b07f-cae94535d95b
\.


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."instances" ("id", "uuid", "raw_base_config", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."oauth_clients" ("id", "client_secret_hash", "registration_type", "redirect_uris", "grant_types", "client_name", "client_uri", "logo_uri", "created_at", "updated_at", "deleted_at", "client_type", "token_endpoint_auth_method") FROM stdin;
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."sessions" ("id", "user_id", "created_at", "updated_at", "factor_id", "aal", "not_after", "refreshed_at", "user_agent", "ip", "tag", "oauth_client_id", "refresh_token_hmac_key", "refresh_token_counter", "scopes") FROM stdin;
6c5efac3-86cc-404a-bde6-4cb760566553	886df54c-0680-43d4-b312-fe22adc7554c	2026-03-28 15:37:15.281942+00	2026-03-28 15:37:15.281942+00	\N	aal1	\N	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36 Edg/146.0.0.0	31.182.77.100	\N	\N	\N	\N	\N
81c60a4a-d716-4001-9504-04fd3aefd9ce	886df54c-0680-43d4-b312-fe22adc7554c	2026-03-28 16:55:55.242461+00	2026-03-28 16:55:55.242461+00	\N	aal1	\N	\N	Mozilla/5.0 (iPhone; CPU iPhone OS 26_2_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/146.0.7680.151 Mobile/15E148 Safari/604.1	83.175.184.3	\N	\N	\N	\N	\N
\.


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."mfa_amr_claims" ("session_id", "created_at", "updated_at", "authentication_method", "id") FROM stdin;
6c5efac3-86cc-404a-bde6-4cb760566553	2026-03-28 15:37:15.351808+00	2026-03-28 15:37:15.351808+00	password	31609dbc-beec-45e2-ab8f-180cf15aefba
81c60a4a-d716-4001-9504-04fd3aefd9ce	2026-03-28 16:55:55.29668+00	2026-03-28 16:55:55.29668+00	password	9cfb3642-0f8c-41af-9c31-333e8c2bfe7e
\.


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."mfa_factors" ("id", "user_id", "friendly_name", "factor_type", "status", "created_at", "updated_at", "secret", "phone", "last_challenged_at", "web_authn_credential", "web_authn_aaguid", "last_webauthn_challenge_data") FROM stdin;
\.


--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."mfa_challenges" ("id", "factor_id", "created_at", "verified_at", "ip_address", "otp_code", "web_authn_session_data") FROM stdin;
\.


--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."oauth_authorizations" ("id", "authorization_id", "client_id", "user_id", "redirect_uri", "scope", "state", "resource", "code_challenge", "code_challenge_method", "response_type", "status", "authorization_code", "created_at", "expires_at", "approved_at", "nonce") FROM stdin;
\.


--
-- Data for Name: oauth_client_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."oauth_client_states" ("id", "provider_type", "code_verifier", "created_at") FROM stdin;
\.


--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."oauth_consents" ("id", "user_id", "client_id", "scopes", "granted_at", "revoked_at") FROM stdin;
\.


--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."one_time_tokens" ("id", "user_id", "token_type", "token_hash", "relates_to", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."refresh_tokens" ("instance_id", "id", "token", "user_id", "revoked", "created_at", "updated_at", "parent", "session_id") FROM stdin;
00000000-0000-0000-0000-000000000000	86	qfkc3kiieesw	886df54c-0680-43d4-b312-fe22adc7554c	f	2026-03-28 15:37:15.321155+00	2026-03-28 15:37:15.321155+00	\N	6c5efac3-86cc-404a-bde6-4cb760566553
00000000-0000-0000-0000-000000000000	87	4mcuxt2k2gkm	886df54c-0680-43d4-b312-fe22adc7554c	f	2026-03-28 16:55:55.269257+00	2026-03-28 16:55:55.269257+00	\N	81c60a4a-d716-4001-9504-04fd3aefd9ce
\.


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."sso_providers" ("id", "resource_id", "created_at", "updated_at", "disabled") FROM stdin;
\.


--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."saml_providers" ("id", "sso_provider_id", "entity_id", "metadata_xml", "metadata_url", "attribute_mapping", "created_at", "updated_at", "name_id_format") FROM stdin;
\.


--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."saml_relay_states" ("id", "sso_provider_id", "request_id", "for_email", "redirect_to", "created_at", "updated_at", "flow_state_id") FROM stdin;
\.


--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."sso_domains" ("id", "sso_provider_id", "domain", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: webauthn_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."webauthn_challenges" ("id", "user_id", "challenge_type", "session_data", "created_at", "expires_at") FROM stdin;
\.


--
-- Data for Name: webauthn_credentials; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."webauthn_credentials" ("id", "user_id", "credential_id", "public_key", "attestation_type", "aaguid", "sign_count", "transports", "backup_eligible", "backed_up", "friendly_name", "created_at", "updated_at", "last_used_at") FROM stdin;
\.


--
-- Data for Name: bookings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."bookings" ("id", "booking_code", "group_name", "email", "phone", "passenger_count", "vehicle_type", "start_date", "end_date", "pickup_location", "dropoff_location", "unit_price", "total_km", "total_extra", "total_amount", "notes", "created_at", "start_time", "end_time", "booking_source", "partner_company_id", "has_partner_company", "partner_company_name", "partner_contact_name", "partner_phone", "partner_email", "partner_notes") FROM stdin;
\.


--
-- Data for Name: drivers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."drivers" ("id", "full_name", "phone", "is_active", "created_at", "phone_normalized") FROM stdin;
8f4024fd-a915-4e54-8e1b-85a3591540b7	Mr Dương	842051555	t	2026-03-24 15:52:51.432095+00	842051555
1efc252a-4726-4674-94c0-78475850635b	Mr Vinh	335609459	t	2026-03-24 15:52:51.432095+00	335609459
97fea09e-0e44-4664-92c8-546f7e9abdcf	Mr Cường	971568636	t	2026-03-24 15:52:51.432095+00	971568636
86cf006e-43e2-4be8-ad83-2e8222cec08e	Mr Ngọc	866697444	t	2026-03-24 15:52:51.432095+00	866697444
7e34508b-9517-4a88-a3ca-3eea10c3be68	Công Bán Tải	972303638	t	2026-03-24 15:52:51.432095+00	972303638
be8cdee9-f04d-41fc-8f87-9bd51ccc6017	Mr Việt	964341709	t	2026-03-24 15:52:51.432095+00	964341709
7c6eb0e3-f089-4eda-83b4-4ffc8ae90162	Mr Hùng	982103663	t	2026-03-24 15:52:51.432095+00	982103663
1ea9e6a1-d7ca-49fe-9fe5-c546fea38a3e	Mr Hiệp	919423682	t	2026-03-24 15:52:51.432095+00	919423682
0e7ad402-2055-4cb3-8417-ac772e4c5b67	Mr Thiên	975905560	t	2026-03-24 15:52:51.432095+00	975905560
787477e8-b020-45f1-85f2-a8a7396f198c	Mr Hiệp	902104264	t	2026-03-24 15:52:51.432095+00	902104264
ea72bce9-c25b-4d23-8355-e3a91105d5ea	Mr Cường	838687938	t	2026-03-24 15:52:51.432095+00	838687938
d02ef83e-4e1c-4523-9c60-9aee33779ba7	Mr Long	969359444	t	2026-03-24 15:52:51.432095+00	969359444
a2579411-e66e-4870-831b-0a0c76ebe123	Mr Quân	339611558	t	2026-03-24 15:52:51.432095+00	339611558
61a05dbc-1166-4688-a3ec-cd03f38df815	Mr Giang	913489985	t	2026-03-24 15:52:51.432095+00	913489985
bd045d93-3d27-4b16-99d1-0bd4f2b48c7c	Mr Lịch	828707860	t	2026-03-24 15:52:51.432095+00	828707860
642607e8-a34a-4e4b-be4c-13a628cfada6	Bản Thôn	378156999	t	2026-03-24 15:52:51.432095+00	378156999
a7bf1646-cc0a-4843-a34e-d8d1fbe8d00b	Dũng	962363446	t	2026-03-24 15:52:51.432095+00	962363446
f780e6a9-67ab-4ab6-a53c-c70ad3bde3aa	Công Bản	367966789	t	2026-03-24 15:52:51.432095+00	367966789
b5626e7f-7c7c-43d8-a5d9-005e5a33103f	Việt TOYOTA	985705186	t	2026-03-24 15:52:51.432095+00	985705186
97b3fbc9-bd71-43f7-a18a-9eccf36bf7c9	A Tuấn	965138968	t	2026-03-24 15:52:51.432095+00	965138968
a3d6a648-be9d-4e13-905d-99f116a8b1ac	Mr Hiệp	943755599	t	2026-03-24 15:52:51.432095+00	943755599
a4b6e7b4-a428-4838-a532-765b6164d0bd	Linh Vinh	941900908	t	2026-03-24 15:52:51.432095+00	941900908
12e13a0c-43e9-4768-9d9d-c7b5b3d5dc7f	Bác Dương Tâm	903290003	t	2026-03-24 15:52:51.432095+00	903290003
f50df115-ca2b-4a09-bfd0-4a862e236647	Mr Cầu	912266116	t	2026-03-24 15:52:51.432095+00	912266116
846372b4-bd02-4f3d-bb84-2f9d96e08b5d	Mr Phương	765466886	t	2026-03-24 15:52:51.432095+00	765466886
7fa00488-c3fe-45ec-a2d0-ddcee3fce250	Mr Phúc	913585030	t	2026-03-24 15:52:51.432095+00	913585030
d31ef053-4b12-40af-a046-cb898bf34184	Mr Long Dcar	988628273	t	2026-03-24 15:52:51.432095+00	988628273
3566b053-4100-483b-b9ca-fdcf34c5a075	Mr Tài	982995363	t	2026-03-24 15:52:51.432095+00	982995363
e8b3dd18-a51f-4f46-b23d-bc802dd5b819	Mr Tâm	913540089	t	2026-03-24 15:52:51.432095+00	913540089
97919363-3325-4fa1-8f63-a439e5493f03	A Luyện	913216987	t	2026-03-24 15:52:51.432095+00	913216987
df461d9f-4279-4a03-ad5e-cdc48ccefad3	Hải Nilon	983238186	t	2026-03-24 15:52:51.432095+00	983238186
\.


--
-- Data for Name: vehicles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."vehicles" ("id", "plate_number", "vehicle_name", "seat_count", "is_active", "created_at", "plate_number_normalized") FROM stdin;
07ba9861-7f27-4147-b03a-bdd61a54c861	30H-94392	PAJERO	7	t	2026-03-24 22:16:20.625866+00	30H-94392
fa5730dc-5e7d-4ade-8b23-dcf568149a86	30G-10453	MUX	7	t	2026-03-24 22:16:20.625866+00	30G-10453
b2d8aee9-93b2-46c0-b319-b9662b326643	30F-77679	Xpander	7	t	2026-03-24 22:16:20.625866+00	30F-77679
b7cb36a6-62ab-463d-92e9-0cb96f820e27	30F-67169	Xpander	7	t	2026-03-24 22:16:20.625866+00	30F-67169
c2515f4d-df04-45ce-8abf-cf4c2ddbf2bc	30G-91710	Innova	7	t	2026-03-24 22:16:20.625866+00	30G-91710
7a0ac678-b59f-41da-abf1-bd9e7e575b42	35C-12247	Ford Ranger	7	t	2026-03-24 22:16:20.625866+00	35C-12247
00b192e3-a83d-4e80-abf8-a0f57adb67ff	30A-24333	Sanatarfe	7	t	2026-03-24 22:16:20.625866+00	30A-24333
9b91df73-5cb0-4fac-aa2b-9f8c822c813a	35A-26031	Xpander	7	t	2026-03-24 22:16:20.625866+00	35A-26031
d7b98563-1280-4eb5-b37c-cbd1e4cac2c7	30E-08094	inova	7	t	2026-03-24 22:16:20.625866+00	30E-08094
02319008-2652-48f2-91c6-da00bd97f2eb	30H-72307	Avenza	7	t	2026-03-24 22:16:20.625866+00	30H-72307
23b3b455-2958-4ac7-a0c7-d0d8e3e8b3bb	30H-94097	Fortuner	7	t	2026-03-24 22:16:20.625866+00	30H-94097
281c81e5-55c0-4a4a-bc7d-40aa28f90eaa	29E-02831	Avenza	7	t	2026-03-24 22:16:20.625866+00	29E-02831
762c6377-43d7-4ade-84d1-60929e5a4339	30E-09222	Inova	7	t	2026-03-24 22:16:20.625866+00	30E-09222
cbac9e76-ac34-4d71-ba7d-a93cf808cbf7	30E-73459	Pajero sport	7	t	2026-03-24 22:16:20.625866+00	30E-73459
f8b10fe0-db82-4fe1-b280-f85dee668578	30H-69080	XL7	7	t	2026-03-24 22:16:20.625866+00	30H-69080
26f9e91d-d46d-4f68-bdab-0a4944607060	30A-99901	eco sport	5	t	2026-03-24 22:16:20.625866+00	30A-99901
4957fe68-0227-4770-8aab-d92d6eb2cdfd	29B-61166	DCar	9	t	2026-03-24 22:16:20.625866+00	29B-61166
9adc21c8-796b-4448-8117-da9407bda1c2	29B-12607	Thaco	35	t	2026-03-24 22:16:20.625866+00	29B-12607
dc35642a-6272-4cff-94f9-f523b321c4a2	29B-12608	Ford Ranger	7	t	2026-03-28 14:19:38.59766+00	29B-12608
\.


--
-- Data for Name: assignments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."assignments" ("id", "booking_code", "group_name", "start_date", "end_date", "vehicle_assigned", "driver_assigned", "quotation_pdf_path", "created_at", "booking_id", "vehicle_type", "status", "updated_at", "vehicle_id", "driver_id", "start_datetime", "end_datetime") FROM stdin;
\.


--
-- Data for Name: itinerary_legs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."itinerary_legs" ("id", "booking_id", "seq_no", "trip_date", "itinerary", "distance_km", "note", "extra_amount", "created_at", "pickup_time", "dropoff_time") FROM stdin;
\.


--
-- Data for Name: partner_companies; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."partner_companies" ("id", "company_name", "contact_name", "phone", "email", "address", "tax_code", "notes", "is_active", "created_at", "updated_at") FROM stdin;
179e8b8d-bb7b-46da-b1fd-7d4435cc042c	Công ty TNHH Du Lịch Á Châu	Nguyễn Văn Hùng	+84 901 100 101	hung@achautravel.vn	Quận 1, TP.HCM	0312345601	Đối tác tour quốc tế	t	2026-03-25 20:50:27.628425+00	2026-03-25 20:50:27.628425+00
563d7b4c-ed2f-4a16-9c23-750d54b14d13	Công ty Vận Tải Minh Phát	Trần Thị Lan	+84 902 100 102	lan@minhphat.vn	Bình Tân, TP.HCM	0312345602	Vận tải hàng hóa	t	2026-03-25 20:50:27.628425+00	2026-03-25 20:50:27.628425+00
ba6b4026-1200-4800-9fdb-3322becbeec2	Saigon Shuttle Services	Lê Quốc Bảo	+84 903 100 103	bao@saigonshuttle.vn	Tân Bình, TP.HCM	0312345603	Đưa đón sân bay	t	2026-03-25 20:50:27.628425+00	2026-03-25 20:50:27.628425+00
5a0e878f-6413-49f0-83fc-3e38b97893ff	Hà Nội Travel Group	Phạm Thu Hà	+84 904 100 104	ha@hanoitravel.vn	Cầu Giấy, Hà Nội	0102345604	Tour miền Bắc	t	2026-03-25 20:50:27.628425+00	2026-03-25 20:50:27.628425+00
3bc889fe-fa8e-4aa0-949d-6f5a7983c1a9	Công ty Logistics Đông Nam Á	Đỗ Minh Tuấn	+84 905 100 105	tuan@sealogs.vn	Thủ Đức, TP.HCM	0312345605	Logistics quốc tế	t	2026-03-25 20:50:27.628425+00	2026-03-25 20:50:27.628425+00
b2e6bf09-e232-4061-aea2-9b36e2a59cce	Express Cargo Việt Nam	Ngô Văn Phúc	+84 907 100 107	phuc@expresscargo.vn	Hải An, Hải Phòng	0202345607	Vận chuyển nhanh	t	2026-03-25 20:50:27.628425+00	2026-03-25 20:50:27.628425+00
fcefda56-90fc-4f7a-882b-e780f838eeab	Công ty TNHH Vận Tải Thành Công	Bùi Thị Hoa	+84 908 100 108	hoa@thanhcong.vn	Biên Hòa, Đồng Nai	3602345608	Xe tải đường dài	t	2026-03-25 20:50:27.628425+00	2026-03-25 20:50:27.628425+00
fdf973ab-77cd-4bd0-a11a-139d96f52043	Mekong Transport Co.	Trương Quốc Khánh	+84 909 100 109	khanh@mekongtransport.vn	Ninh Kiều, Cần Thơ	1802345609	Vận tải miền Tây	t	2026-03-25 20:50:27.628425+00	2026-03-25 20:50:27.628425+00
75db3f7e-dc10-45d0-83d9-d7e6fb4ea0a6	City Ride Vietnam	Nguyễn Hoàng Nam	+84 910 100 110	nam@cityride.vn	Quận 7, TP.HCM	0312345610	Xe hợp đồng	t	2026-03-25 20:50:27.628425+00	2026-03-25 20:50:27.628425+00
ef1bffa0-bb01-4575-9b3f-0d96da683716	Công ty TNHH Du Lịch Biển Xanh	Lý Thị Ngọc	+84 911 100 111	ngoc@bienxanh.vn	Nha Trang, Khánh Hòa	4202345611	Tour biển	t	2026-03-25 20:50:27.628425+00	2026-03-25 20:50:27.628425+00
8964c09f-3792-484b-8475-72829da25475	Prime Logistics Vietnam	Phan Văn Đức	+84 912 100 112	duc@primelog.vn	Thuận An, Bình Dương	3702345612	Kho vận	t	2026-03-25 20:50:27.628425+00	2026-03-25 20:50:27.628425+00
0505c2d0-c8bd-4c99-856f-1fb179e07e1b	Công ty Vận Tải Hòa Bình	Đặng Thị Hạnh	+84 913 100 113	hanh@hoabinhtrans.vn	Thanh Xuân, Hà Nội	0102345613	Vận tải hành khách	t	2026-03-25 20:50:27.628425+00	2026-03-25 20:50:27.628425+00
0d66bbcb-7733-42f8-a703-d4dec2679dc2	Smart Fleet Vietnam	Hoàng Gia Bảo	+84 914 100 114	bao@smartfleet.vn	TP Thủ Đức, TP.HCM	0312345614	Quản lý đội xe	t	2026-03-25 20:50:27.628425+00	2026-03-25 20:50:27.628425+00
1819a2ad-0941-4f6a-8be0-7bea4634148b	Công ty TNHH Đông Á Mobility	Tạ Minh Châu	+84 915 100 115	chau@dongamobility.vn	Long Biên, Hà Nội	0102345615	Giải pháp di chuyển	t	2026-03-25 20:50:27.628425+00	2026-03-25 20:50:27.628425+00
34988496-7550-48b8-ac8c-1f27fcc0fec5	Travel Connect Vietnam	Nguyễn Thị Thảo	+84 916 100 116	thao@travelconnect.vn	Huế, Thừa Thiên Huế	3302345616	Đại lý du lịch	t	2026-03-25 20:50:27.628425+00	2026-03-25 20:50:27.628425+00
6593553f-b990-4206-9770-b8460b3cbafc	Rapid Transport VN	Võ Minh Trí	+84 917 100 117	tri@rapidvn.vn	Dĩ An, Bình Dương	3702345617	Giao hàng nhanh	t	2026-03-25 20:50:27.628425+00	2026-03-25 20:50:27.628425+00
18b82b7d-226b-4a7b-9ffb-7d0a95665d85	Elite Coach Vietnam	Trần Quốc Việt	+84 918 100 118	viet@elitecoach.vn	Quy Nhơn, Bình Định	5202345618	Xe du lịch cao cấp	t	2026-03-25 20:50:27.628425+00	2026-03-25 20:50:27.628425+00
45104f7e-c793-4da6-aaa7-e06130922216	NextGen Mobility Vietnam	Phạm Anh Dũng	+84 920 100 120	dung@nextgen.vn	Nam Từ Liêm, Hà Nội	0102345620	Giải pháp vận tải thông minh	t	2026-03-25 20:50:27.628425+00	2026-03-25 20:50:27.628425+00
eb131793-e3bf-495b-ae71-ac0656323190	Công ty Du Lịch Việt Xanh	Vũ Thanh Mai	+84 906 100 106	mai@vietxanh.vn	Hải Châu, Đà Nẵng	0402345606	Tour nội địa	t	2026-03-25 20:50:27.628425+00	2026-03-26 11:01:45.369+00
1f1c3117-e4ec-4968-b287-ffbd93d0dbdd	BlueWave Logistics VN	Lâm Thu Trang	+84 919 100 119	trang@bluewave.vn	Vũng Tàu, Bà Rịa–VT	3502345619	Vận tải biển	t	2026-03-25 20:50:27.628425+00	2026-03-28 14:20:49.286+00
\.


--
-- Data for Name: quotations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."quotations" ("id", "booking_id", "booking_code", "pdf_path", "file_name", "total_amount", "created_at") FROM stdin;
\.


--
-- Data for Name: service_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."service_categories" ("id", "name", "created_at") FROM stdin;
6dd65e70-7fdd-4bd5-a959-df1cf0079b56	du_lich	2026-03-27 14:01:18.406381+00
513cdc7e-367a-4211-a527-9930e6b5cb2d	mien_bac	2026-03-27 14:01:18.406381+00
885b8a67-6f4a-43d0-aaea-5802c0b321f1	dong_tay_bac	2026-03-27 14:01:18.406381+00
d79f1184-5620-42c7-907b-7e8a668f1f7a	du_lich_lao	2026-03-27 14:01:18.406381+00
80134707-2431-40fc-a585-9b16b3b5e430	du_lich_bien	2026-03-27 14:01:18.406381+00
\.


--
-- Data for Name: service_packages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."service_packages" ("id", "name", "category", "duration_days", "vehicle_type", "is_active", "source_url", "source_note", "created_at") FROM stdin;
2ca55ba2-2fa8-4193-bb49-5b7439e36632	Hà Nội - Sa Pa 3N2D	dong_tay_bac	3	29	t	https://hdtransport.vn/	Seed mẫu theo nhóm tuyến Tây Bắc trên website	2026-03-27 14:01:18.406381+00
abf99d70-ff7a-4381-9fa8-4f28577a1306	Legacy Yên Tử 2N1Đ	mien_bac	2	16	t	https://hdtransport.vn/thue-xe-du-lich-nghi-duong-legacy-yen-tu.html	Seed từ tuyến nghỉ dưỡng Legacy Yên Tử	2026-03-27 14:01:18.406381+00
4c4f5f00-b8e0-4521-837f-d72d6f4173e7	Sầm Sơn 2N1Đ	du_lich_bien	2	29	t	https://hdtransport.vn/thue-xe-du-lich-sam-son.html	Seed từ tuyến Sầm Sơn	2026-03-27 14:01:18.406381+00
ce417487-f7e9-4251-ad12-1dc1430927bd	Paksan - Viêng Chăn - Luông Prabang - Xiêng 6N5Đ	du_lich_lao	6	29	t	https://hdtransport.vn/thue-xe-du-lich-paksan-vieng-chan-luong-prabang-xieng.html	Seed từ tuyến du lịch Lào	2026-03-27 14:01:18.406381+00
d48d038c-ca43-4919-9938-3b23add5d62a	Hà Nội - Ninh Bình 3N2D	du_lich	3	29	t	https://hdtransport.vn/thue-xe-du-lich-ninh-binh.html	Seed từ tuyến du lịch Ninh Bình	2026-03-27 14:01:18.406381+00
bc5f3bd9-0804-42d5-b0cb-db880f41dea0	Hà Nội - Hà Giang 3N2D	dong_tay_bac	3	29	t	https://hdtransport.vn/thue-xe-du-lich-ha-giang-tam-giac-mach.html	Seed từ tuyến Hà Giang tam giác mạch	2026-03-27 14:01:18.406381+00
\.


--
-- Data for Name: service_package_legs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."service_package_legs" ("id", "service_package_id", "seq_no", "day_no", "pickup_time", "dropoff_time", "itinerary", "distance_km", "note", "extra_amount", "created_at") FROM stdin;
181c5876-7f42-4c74-bc5f-484e5a4c6eac	2ca55ba2-2fa8-4193-bb49-5b7439e36632	1	1	06:00	12:00	Hà Nội → Sa Pa	320		0	2026-03-27 14:01:18.406381+00
1c813553-130d-4172-9494-419ed8853502	2ca55ba2-2fa8-4193-bb49-5b7439e36632	2	2	08:00	17:00	Bản Cát Cát → Fansipan	50		0	2026-03-27 14:01:18.406381+00
f8f214d6-ae77-4cf6-8b4a-c75680d1f58f	2ca55ba2-2fa8-4193-bb49-5b7439e36632	3	3	09:00	15:00	Sa Pa → Hà Nội	320		0	2026-03-27 14:01:18.406381+00
956a6ba1-f814-47a6-a043-51aebf1a3eab	abf99d70-ff7a-4381-9fa8-4f28577a1306	1	1	07:30	11:30	Hà Nội → Legacy Yên Tử	140		0	2026-03-27 14:01:18.406381+00
a2ce1114-c78c-4b12-815a-182f701e4296	abf99d70-ff7a-4381-9fa8-4f28577a1306	2	2	10:00	14:30	Legacy Yên Tử → Hà Nội	140		0	2026-03-27 14:01:18.406381+00
88cd9890-49d1-4981-bc5b-39a5b7cb0d56	4c4f5f00-b8e0-4521-837f-d72d6f4173e7	1	1	06:00	10:30	Hà Nội → Sầm Sơn	170		0	2026-03-27 14:01:18.406381+00
b9afb577-e3a1-43a7-990d-10bf2b53b3c6	4c4f5f00-b8e0-4521-837f-d72d6f4173e7	2	2	14:00	18:30	Sầm Sơn → Hà Nội	170		0	2026-03-27 14:01:18.406381+00
dce76ea3-8e1c-4644-95ab-ece111a95df1	ce417487-f7e9-4251-ad12-1dc1430927bd	1	1	06:00	15:30	Hà Nội → Cửa khẩu → Paksan	320		0	2026-03-27 14:01:18.406381+00
9b06dc29-bfe2-4f06-88cb-b192eeaec26c	ce417487-f7e9-4251-ad12-1dc1430927bd	2	2	08:00	16:00	Paksan → Viêng Chăn	150		0	2026-03-27 14:01:18.406381+00
9e7522a7-5dc0-4988-9702-0d962a263668	ce417487-f7e9-4251-ad12-1dc1430927bd	3	3	07:00	17:00	Viêng Chăn → Luông Prabang	340		0	2026-03-27 14:01:18.406381+00
eb71a982-9742-4a3b-9807-3fc77f90eba7	ce417487-f7e9-4251-ad12-1dc1430927bd	4	4	08:00	17:00	Tham quan Luông Prabang	40		0	2026-03-27 14:01:18.406381+00
69591199-b953-44a1-930d-c16458b9da90	ce417487-f7e9-4251-ad12-1dc1430927bd	5	5	07:30	16:30	Luông Prabang → Xiêng Khoảng	260		0	2026-03-27 14:01:18.406381+00
1728641f-f48c-4432-bd68-2c7349482a1a	ce417487-f7e9-4251-ad12-1dc1430927bd	6	6	07:00	18:00	Xiêng Khoảng → Viêng Chăn / cửa khẩu về Việt Nam	360		0	2026-03-27 14:01:18.406381+00
56001235-8591-4dc0-bc3b-419d99502ab3	d48d038c-ca43-4919-9938-3b23add5d62a	1	1	07:00	11:00	Hà Nội → Hoa Lư → Tam Cốc	120	\N	0	2026-03-28 14:21:39.932992+00
9a1cfaa3-f0e4-4172-ba1a-77e405c2d19b	d48d038c-ca43-4919-9938-3b23add5d62a	2	2	08:00	17:00	Tràng An → Hang Múa	60	\N	0	2026-03-28 14:21:39.932992+00
f51eb7ea-ba32-43e6-ab96-d275761b1e32	d48d038c-ca43-4919-9938-3b23add5d62a	3	3	09:00	13:00	Ninh Bình → Hà Nội	120	\N	0	2026-03-28 14:21:39.932992+00
306e141d-e930-4988-9b58-7590fb15edbe	bc5f3bd9-0804-42d5-b0cb-db880f41dea0	1	1	07:00	13:00	Hà Nội → Hà Giang	300	\N	0	2026-03-28 14:25:41.518946+00
054b43fc-cb68-4225-85dd-17686080945c	bc5f3bd9-0804-42d5-b0cb-db880f41dea0	2	2	07:00	18:00	Hà Giang → Đồng Văn → Mèo Vạc	200	\N	0	2026-03-28 14:25:41.518946+00
dadff763-f8fc-432f-8262-039166071d3a	bc5f3bd9-0804-42d5-b0cb-db880f41dea0	3	3	08:00	17:00	Hà Giang → Hà Nội	300	\N	0	2026-03-28 14:25:41.518946+00
\.


--
-- Data for Name: user_profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."user_profiles" ("id", "email", "full_name", "role", "is_active", "created_at", "updated_at") FROM stdin;
886df54c-0680-43d4-b312-fe22adc7554c	admin.hdtransport@gmail.com	Admin HD	admin	t	2026-03-28 13:14:23.374305+00	2026-03-28 13:14:23.374305+00
853c53ba-58cf-4bdc-a8a0-bee7678f4e30	operator.hdtransport@gmail.com	Điều hành HD	operator	t	2026-03-28 13:26:03.240772+00	2026-03-28 13:26:03.240772+00
dc70628c-8f07-4b11-a0f5-7625e351c024	accountant.hdtransport@gmail.com	Kế toán HD	accountant	t	2026-03-28 13:26:53.741996+00	2026-03-28 13:26:53.741996+00
6598d5b2-cde1-420d-abf4-5ea45cbcfeab	hdtransportravel@gmail.com	Giám đốc HD	manager	t	2026-03-28 13:34:38.326444+00	2026-03-28 13:34:50.977167+00
e30f37e3-e82a-4128-85c6-0ca7a606e3f3	manager.hdtransport@gmail.com	Giám đốc HD	manager	t	2026-03-28 13:42:17.702029+00	2026-03-28 13:42:17.702029+00
7ec64b10-d21f-4853-b9b8-3fc35b7ae5b5	sales.hdtransport@gmail.com	Sales HD	sales	t	2026-03-28 13:15:39.573073+00	2026-03-28 14:21:24.413345+00
\.


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."buckets" ("id", "name", "owner", "created_at", "updated_at", "public", "avif_autodetection", "file_size_limit", "allowed_mime_types", "owner_id", "type") FROM stdin;
quotations	quotations	\N	2026-03-23 17:22:26.725983+00	2026-03-23 17:22:26.725983+00	f	f	\N	\N	\N	STANDARD
\.


--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."buckets_analytics" ("name", "type", "format", "created_at", "updated_at", "id", "deleted_at") FROM stdin;
\.


--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."objects" ("id", "bucket_id", "name", "owner", "created_at", "updated_at", "last_accessed_at", "metadata", "version", "owner_id", "user_metadata") FROM stdin;
76e67ab4-a5ab-4935-b256-b32faeb215cf	quotations	2026/03/preliminary-quotation-HD-2026-2-1774542709265.pdf	\N	2026-03-26 16:31:49.463408+00	2026-03-26 16:31:49.463408+00	2026-03-26 16:31:49.463408+00	{"eTag": "\\"d19fa76e355860f979043fd8f51bd648\\"", "size": 47405, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-03-26T16:31:50.000Z", "contentLength": 47405, "httpStatusCode": 200}	56be2939-c631-4126-90df-abf9fc899a0e	\N	{}
6dd3689f-397c-4627-b1e7-307b000d9215	quotations	2026/03/preliminary-quotation-HD-2026-2-1774652430247.pdf	\N	2026-03-27 23:00:30.286501+00	2026-03-27 23:00:30.286501+00	2026-03-27 23:00:30.286501+00	{"eTag": "\\"6843bf2fca1d79694199fb76cfc86d25\\"", "size": 47406, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-03-27T23:00:31.000Z", "contentLength": 47406, "httpStatusCode": 200}	ffdd1c59-2abc-4c0f-96ec-3254a74221fb	\N	{}
b1b6eff0-101c-477a-bd14-438c97155bed	quotations	2026/03/preliminary-quotation-Qdafsdag-1774655784830.pdf	\N	2026-03-27 23:56:25.102361+00	2026-03-27 23:56:25.102361+00	2026-03-27 23:56:25.102361+00	{"eTag": "\\"5e57c50321e4264b623c9ef29f8466cf\\"", "size": 47667, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-03-27T23:56:26.000Z", "contentLength": 47667, "httpStatusCode": 200}	24a52d27-8c89-4da5-b67c-07b59503ad26	\N	{}
eca56e03-450b-4498-b97b-0b940a366f51	quotations	2026/03/preliminary-quotation-HD-123-1774706269535.pdf	\N	2026-03-28 13:57:50.404106+00	2026-03-28 13:57:50.404106+00	2026-03-28 13:57:50.404106+00	{"eTag": "\\"a8162872e92502a5283fa130e154bf20\\"", "size": 48000, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-03-28T13:57:51.000Z", "contentLength": 48000, "httpStatusCode": 200}	ef9ca559-1bbf-4846-a7ca-b3e3503f0b14	\N	{}
f2954f41-8bee-4169-a76c-9607d212bfdd	quotations	2026/03/final-invoice-HD-123-1774706425021.pdf	\N	2026-03-28 14:00:26.11953+00	2026-03-28 14:00:26.11953+00	2026-03-28 14:00:26.11953+00	{"eTag": "\\"e2e38c93c602f5d99d9c22e3d4533c36\\"", "size": 47892, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-03-28T14:00:27.000Z", "contentLength": 47892, "httpStatusCode": 200}	27811a62-c511-462c-bebe-cd7e7f7ea878	\N	{}
ab36bafc-2bc6-4603-aeae-f2d0514d7bca	quotations	2026/03/final-invoice-HD-123-1774706860081.pdf	\N	2026-03-28 14:07:40.005901+00	2026-03-28 14:07:40.005901+00	2026-03-28 14:07:40.005901+00	{"eTag": "\\"42177a20915f8b33b727b6543967bc63\\"", "size": 47918, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-03-28T14:07:40.000Z", "contentLength": 47918, "httpStatusCode": 200}	eb651534-a6ec-4a32-a2cb-cbea00d84759	\N	{}
fb70e959-11aa-4ab9-ad87-be1c7f61c0e2	quotations	2026/03/final-invoice-HD-123-1774707002595.pdf	\N	2026-03-28 14:10:03.378734+00	2026-03-28 14:10:03.378734+00	2026-03-28 14:10:03.378734+00	{"eTag": "\\"c654d764b7e1dd84880dfea782400b6f\\"", "size": 47919, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-03-28T14:10:04.000Z", "contentLength": 47919, "httpStatusCode": 200}	db2bfdfc-710c-4d8f-97fb-a13dd0734ce8	\N	{}
2ef16d23-2818-4794-a280-841b78dbebcb	quotations	2026/03/final-invoice-HD-123-1774707548602.pdf	\N	2026-03-28 14:19:08.41838+00	2026-03-28 14:19:08.41838+00	2026-03-28 14:19:08.41838+00	{"eTag": "\\"9963cad76c08d91b90d473c4f62705de\\"", "size": 47916, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-03-28T14:19:09.000Z", "contentLength": 47916, "httpStatusCode": 200}	623ca78e-c7fa-46dd-9a27-95390394f91c	\N	{}
bf45067d-72a3-4cd7-8238-56ec83c3aefb	quotations	2026/03/preliminary-quotation-HD-2026-056-1774650655426.pdf	\N	2026-03-27 22:30:56.388443+00	2026-03-27 22:30:56.388443+00	2026-03-27 22:30:56.388443+00	{"eTag": "\\"54d087e17cf4e3e3f6ccf87b968d30ab\\"", "size": 47743, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-03-27T22:30:57.000Z", "contentLength": 47743, "httpStatusCode": 200}	33ba7cb8-dcfc-4f95-8c05-bbbde6e8fc4e	\N	{}
f7c64070-b415-4196-87c8-f82475f87c2a	quotations	2026/03/final-invoice-HD-2026-056-1774650881544.pdf	\N	2026-03-27 22:34:42.457462+00	2026-03-27 22:34:42.457462+00	2026-03-27 22:34:42.457462+00	{"eTag": "\\"7005b220f786d95bb4fa105cee729be3\\"", "size": 47622, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-03-27T22:34:43.000Z", "contentLength": 47622, "httpStatusCode": 200}	30a21a4f-c20e-43ed-b24f-5c5b70496f68	\N	{}
510d87f0-e9c3-45a7-86f1-397f52aaaf35	quotations	2026/03/preliminary-quotation-sdasfasg-1774655110198.pdf	\N	2026-03-27 23:45:10.431079+00	2026-03-27 23:45:10.431079+00	2026-03-27 23:45:10.431079+00	{"eTag": "\\"313a0d9bbdc779432131c028f96e0887\\"", "size": 47005, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-03-27T23:45:11.000Z", "contentLength": 47005, "httpStatusCode": 200}	6160bde7-8be7-4371-be84-6b09968c1a14	\N	{}
fd19eff3-d27f-4ab6-9566-442463fe2c73	quotations	2026/.emptyFolderPlaceholder	\N	2026-03-24 12:31:53.300031+00	2026-03-24 12:31:53.300031+00	2026-03-24 12:31:53.300031+00	{"eTag": "\\"d41d8cd98f00b204e9800998ecf8427e\\"", "size": 0, "mimetype": "application/octet-stream", "cacheControl": "max-age=3600", "lastModified": "2026-03-24T12:31:53.296Z", "contentLength": 0, "httpStatusCode": 200}	9a525727-9550-4574-a084-8198111e2d6b	\N	{}
9c3d1f13-2f8c-4d7b-8ea3-e5737ed36036	quotations	2026/03/HD-2026-2-1774355967969.pdf	\N	2026-03-24 12:39:28.432702+00	2026-03-24 12:39:28.432702+00	2026-03-24 12:39:28.432702+00	{"eTag": "\\"9bdccc2926ed6a36f7cabbd171449ea0\\"", "size": 48057, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-03-24T12:39:29.000Z", "contentLength": 48057, "httpStatusCode": 200}	b1acbb18-df97-40a5-99ed-d21a09d2ad78	\N	{}
097dcca2-60e8-4c50-b8f1-1029f551d931	quotations	2026/03/HD-2026-3-1774358671769.pdf	\N	2026-03-24 13:24:32.035954+00	2026-03-24 13:24:32.035954+00	2026-03-24 13:24:32.035954+00	{"eTag": "\\"6719441c455e510cabfba4abd9ec8534\\"", "size": 48071, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-03-24T13:24:32.000Z", "contentLength": 48071, "httpStatusCode": 200}	2e46f675-19c8-4056-9962-e9e5cf2283d3	\N	{}
8fdb5bfb-c3ac-4733-85ea-71a33f20414b	quotations	2026/03/HD-2026-1-1774361517076.pdf	\N	2026-03-24 14:11:57.311826+00	2026-03-24 14:11:57.311826+00	2026-03-24 14:11:57.311826+00	{"eTag": "\\"1f13802e02f0fcc4ed2c583e453c168b\\"", "size": 47915, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-03-24T14:11:58.000Z", "contentLength": 47915, "httpStatusCode": 200}	ed69fa1f-1c5f-4e28-a662-ffb14b670476	\N	{}
20216e01-138e-45f7-a339-4a073acb7e0c	quotations	2026/03/HD-2026-4-1774368152798.pdf	\N	2026-03-24 16:02:33.106873+00	2026-03-24 16:02:33.106873+00	2026-03-24 16:02:33.106873+00	{"eTag": "\\"785f569a9d51f964ccfc57e9aab340c5\\"", "size": 48052, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-03-24T16:02:34.000Z", "contentLength": 48052, "httpStatusCode": 200}	eff0609f-afa0-49de-9714-679d06a7d6fb	\N	{}
9723c285-febc-417a-9c3a-29b68208879f	quotations	2026/03/HD-2026-5-1774368711257.pdf	\N	2026-03-24 16:11:51.578495+00	2026-03-24 16:11:51.578495+00	2026-03-24 16:11:51.578495+00	{"eTag": "\\"15157adddd39c5358bda5a34e903cc75\\"", "size": 47919, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-03-24T16:11:52.000Z", "contentLength": 47919, "httpStatusCode": 200}	f639c0d8-eaaf-4e97-88ae-002f55bc8d49	\N	{}
2d2674e5-a346-487d-b14f-203a3ae51e00	quotations	2026/03/HD-2026-002-1774385129164.pdf	\N	2026-03-24 20:45:29.492491+00	2026-03-24 20:45:29.492491+00	2026-03-24 20:45:29.492491+00	{"eTag": "\\"94b1d093020352cda12be1d58fa8a89c\\"", "size": 48564, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-03-24T20:45:30.000Z", "contentLength": 48564, "httpStatusCode": 200}	328eb942-39d5-4524-932a-f2e7003b0d03	\N	{}
85409adc-6731-4cda-b04f-a55582999598	quotations	2026/03/HD-2026-5-1774440065517.pdf	\N	2026-03-25 12:01:05.63905+00	2026-03-25 12:01:05.63905+00	2026-03-25 12:01:05.63905+00	{"eTag": "\\"06dc9bb9ab4785ea05a55aff4500ec61\\"", "size": 48101, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-03-25T12:01:06.000Z", "contentLength": 48101, "httpStatusCode": 200}	f596a3ca-f0d8-43d2-ba0d-1b7296df8309	\N	{}
87ed50f7-400c-4f09-a3cd-cf685e37baa9	quotations	2026/03/HD-2026-2-1774440262455.pdf	\N	2026-03-25 12:04:22.683628+00	2026-03-25 12:04:22.683628+00	2026-03-25 12:04:22.683628+00	{"eTag": "\\"ddff373830368e3643f5286f220f9c3c\\"", "size": 47973, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-03-25T12:04:23.000Z", "contentLength": 47973, "httpStatusCode": 200}	8ef12a6b-bb0b-4e7e-a2f0-03242d76b367	\N	{}
b4066069-fddf-4070-a757-b14d7205bcac	quotations	2026/03/HD-2026-2-1774455087839.pdf	\N	2026-03-25 16:11:27.993453+00	2026-03-25 16:11:27.993453+00	2026-03-25 16:11:27.993453+00	{"eTag": "\\"71dfbd43372e765f9cdefce7a6227913\\"", "size": 47831, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-03-25T16:11:28.000Z", "contentLength": 47831, "httpStatusCode": 200}	9d31f9fc-93dd-4446-95fe-93312ad310a9	\N	{}
c2737173-ec3a-4e3c-b469-001f93f5b6ed	quotations	2026/03/final-invoice-HD-2026-1-1774464080473.pdf	\N	2026-03-25 18:41:20.668092+00	2026-03-25 18:41:20.668092+00	2026-03-25 18:41:20.668092+00	{"eTag": "\\"67ed894f35f05fffec073e15234b3b55\\"", "size": 47583, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-03-25T18:41:21.000Z", "contentLength": 47583, "httpStatusCode": 200}	4b99ca0d-634a-49a8-8919-e00b778f0c79	\N	{}
\.


--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."s3_multipart_uploads" ("id", "in_progress_size", "upload_signature", "bucket_id", "key", "version", "owner_id", "created_at", "user_metadata") FROM stdin;
\.


--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."s3_multipart_uploads_parts" ("id", "upload_id", "size", "part_number", "bucket_id", "key", "etag", "owner_id", "version", "created_at") FROM stdin;
\.


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 87, true);


--
-- PostgreSQL database dump complete
--

-- \unrestrict p5wlgHyaY2eHGYwMfhRFUFD1oihZblyKvmGYajPbYUZedaOBYPGirau3IegW0JN

RESET ALL;
