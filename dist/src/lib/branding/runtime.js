export function paletteToCssVars(colors) {
    const vars = {
        "--brand-primary": colors.primary,
        "--brand-secondary": colors.secondary,
        "--brand-accent": colors.accent,
        "--brand-background": colors.background,
        "--brand-surface": colors.surface,
        "--z-accent-color": colors.accent,
        "--z-accent": colors.accent,
        "--z-bg": colors.background,
        "--z-surface": colors.surface,
    };
    if (colors.danger)
        vars["--brand-danger"] = colors.danger;
    if (colors.warning)
        vars["--brand-warning"] = colors.warning;
    if (colors.success)
        vars["--brand-success"] = colors.success;
    return vars;
}
export function typographyToCssVars(typography) {
    const vars = {
        "--brand-font-heading": typography.headingFamily,
        "--brand-font-body": typography.bodyFamily,
        "--brand-font-base-size": `${typography.baseSizePx}px`,
        "--brand-font-heading-scale": String(typography.headingScale),
        "--brand-font-line-height": String(typography.lineHeight),
        "--z-font-sans": typography.bodyFamily,
    };
    if (typography.monoFamily)
        vars["--brand-font-mono"] = typography.monoFamily;
    if (typography.letterSpacing != null) {
        vars["--brand-font-letter-spacing"] = `${typography.letterSpacing}em`;
    }
    return vars;
}
export function componentsToCssVars(components) {
    const vars = {
        "--brand-button-radius": components.buttonRadius,
        "--brand-card-radius": components.cardRadius,
        "--z-radius-md": components.buttonRadius,
        "--z-radius-lg": components.cardRadius,
    };
    if (components.buttonShadow)
        vars["--brand-button-shadow"] = components.buttonShadow;
    if (components.cardBorder) {
        vars["--brand-card-border"] = components.cardBorder;
        vars["--z-border"] = components.cardBorder;
    }
    if (components.navBackground)
        vars["--brand-nav-bg"] = components.navBackground;
    if (components.navForeground)
        vars["--brand-nav-fg"] = components.navForeground;
    if (components.sidebarBackground)
        vars["--brand-sidebar-bg"] = components.sidebarBackground;
    if (components.sidebarForeground)
        vars["--brand-sidebar-fg"] = components.sidebarForeground;
    return vars;
}
export function brandingCssVars(profile) {
    return Object.assign(Object.assign(Object.assign({}, paletteToCssVars(profile.colors)), typographyToCssVars(profile.typography)), componentsToCssVars(profile.components));
}
export function serializeCssVars(vars, selector = ":root") {
    const body = Object.entries(vars)
        .map(([key, value]) => `  ${key}: ${value};`)
        .join("\n");
    return `${selector} {\n${body}\n}`;
}
export function previewCssFromTheme(preset) {
    const vars = Object.assign(Object.assign(Object.assign({}, paletteToCssVars(preset.tokens.colors)), typographyToCssVars(preset.tokens.typography)), componentsToCssVars(preset.tokens.components));
    return serializeCssVars(vars);
}
export function buildBrandingRuntime(input) {
    var _a, _b, _c, _d;
    const profile = input.profile;
    if (!profile) {
        return {
            tenantId: input.tenantId,
            cssVariables: {},
            cssText: "",
            logo: { light: null, dark: null, monochrome: null, width: null, height: null },
            icons: { favicon: null, appIcon192: null, appIcon512: null, touchIcon: null },
            headerFooter: { footerLinks: [] },
            loginPage: {},
            pdfExport: { logo: null, pageNumbers: true },
            publicPages: { showPoweredBy: true },
            themeKey: null,
            emailIdentity: (_a = input.emailIdentity) !== null && _a !== void 0 ? _a : null,
            domain: (_b = input.domain) !== null && _b !== void 0 ? _b : null,
        };
    }
    const vars = brandingCssVars(profile);
    return {
        tenantId: input.tenantId,
        cssVariables: vars,
        cssText: serializeCssVars(vars),
        logo: profile.logo,
        icons: profile.icons,
        headerFooter: profile.header_footer,
        loginPage: profile.login_page,
        pdfExport: profile.pdf_export,
        publicPages: profile.public_pages,
        themeKey: profile.theme_key,
        emailIdentity: (_c = input.emailIdentity) !== null && _c !== void 0 ? _c : null,
        domain: (_d = input.domain) !== null && _d !== void 0 ? _d : null,
    };
}
export function applyEmailIdentity(identity, fallback = {
    fromName: "ZiroWork",
    fromEmail: "noreply@ziro.work",
    replyTo: null,
    verified: false,
}) {
    var _a;
    if (!identity)
        return fallback;
    return {
        fromName: identity.from_name,
        fromEmail: identity.from_email,
        replyTo: (_a = identity.reply_to_email) !== null && _a !== void 0 ? _a : null,
        verified: identity.status === "verified" || identity.status === "pending"
            ? identity.status === "verified"
            : false,
    };
}
export function resolveDomainHostStub(host) {
    var _a;
    const h = (host || "").toLowerCase();
    const hostname = (_a = h.split(":")[0]) !== null && _a !== void 0 ? _a : "";
    const isLocal = hostname === "localhost" ||
        hostname === "127.0.0.1" ||
        hostname === "[::1]";
    return {
        host: h,
        isCustom: h.length > 0 &&
            !isLocal &&
            !h.endsWith(".ziro.work") &&
            !h.endsWith(".vercel.app"),
    };
}
