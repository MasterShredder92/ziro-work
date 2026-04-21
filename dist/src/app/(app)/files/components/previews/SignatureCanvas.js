"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useRef, useState } from "react";
export function SignatureCanvas({ width = 480, height = 160, onChange, disabled = false, initialDataUrl = null, }) {
    const canvasRef = useRef(null);
    const drawingRef = useRef(false);
    const lastRef = useRef(null);
    const [empty, setEmpty] = useState(!initialDataUrl);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas)
            return;
        const ctx = canvas.getContext("2d");
        if (!ctx)
            return;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = "#111111";
        if (initialDataUrl) {
            const img = new Image();
            img.onload = () => {
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                setEmpty(false);
            };
            img.src = initialDataUrl;
        }
    }, [initialDataUrl]);
    const getPos = useCallback((e) => {
        const canvas = canvasRef.current;
        if (!canvas)
            return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY,
        };
    }, []);
    const handleDown = (e) => {
        var _a, _b;
        if (disabled)
            return;
        drawingRef.current = true;
        const ctx = (_a = canvasRef.current) === null || _a === void 0 ? void 0 : _a.getContext("2d");
        if (!ctx)
            return;
        const { x, y } = getPos(e);
        lastRef.current = { x, y };
        ctx.beginPath();
        ctx.moveTo(x, y);
        (_b = canvasRef.current) === null || _b === void 0 ? void 0 : _b.setPointerCapture(e.pointerId);
    };
    const handleMove = (e) => {
        var _a;
        if (disabled || !drawingRef.current)
            return;
        const ctx = (_a = canvasRef.current) === null || _a === void 0 ? void 0 : _a.getContext("2d");
        if (!ctx)
            return;
        const { x, y } = getPos(e);
        const last = lastRef.current;
        if (!last) {
            lastRef.current = { x, y };
            return;
        }
        const midX = (last.x + x) / 2;
        const midY = (last.y + y) / 2;
        ctx.quadraticCurveTo(last.x, last.y, midX, midY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(midX, midY);
        lastRef.current = { x, y };
        if (empty)
            setEmpty(false);
    };
    const handleUp = (e) => {
        var _a, _b, _c;
        if (!drawingRef.current)
            return;
        drawingRef.current = false;
        try {
            (_a = canvasRef.current) === null || _a === void 0 ? void 0 : _a.releasePointerCapture(e.pointerId);
        }
        catch (_d) {
            /* ignore */
        }
        lastRef.current = null;
        const data = (_c = (_b = canvasRef.current) === null || _b === void 0 ? void 0 : _b.toDataURL("image/png")) !== null && _c !== void 0 ? _c : null;
        onChange === null || onChange === void 0 ? void 0 : onChange(data);
    };
    const clear = () => {
        const canvas = canvasRef.current;
        if (!canvas)
            return;
        const ctx = canvas.getContext("2d");
        if (!ctx)
            return;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        lastRef.current = null;
        setEmpty(true);
        onChange === null || onChange === void 0 ? void 0 : onChange(null);
    };
    return (_jsxs("div", { className: "flex flex-col gap-2", children: [_jsx("canvas", { ref: canvasRef, width: width, height: height, onPointerDown: handleDown, onPointerMove: handleMove, onPointerUp: handleUp, onPointerCancel: handleUp, style: { touchAction: "none" }, className: "w-full max-w-full cursor-crosshair rounded-md border border-[var(--z-border)] bg-white" }), _jsxs("div", { className: "flex items-center justify-between text-xs text-[var(--z-muted)]", children: [_jsx("span", { children: empty ? "Sign above" : "Signature captured" }), _jsx("button", { type: "button", onClick: clear, disabled: disabled, className: "rounded border border-[var(--z-border)] px-2 py-1 text-xs text-[var(--z-fg)] hover:bg-white/[0.04] disabled:opacity-50", children: "Clear" })] })] }));
}
