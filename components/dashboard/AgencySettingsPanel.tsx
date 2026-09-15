"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  addAgencyMember,
  fetchAgencyProfile,
  removeAgencyMember,
  updateAgencyName,
  uploadAgencyLogo,
  type AgencyMember,
  type AgencyProfile,
} from "@/lib/api/agency";
import { useToast } from "@/components/ui/Toast";

export function AgencySettingsPanel() {
  const { toast } = useToast();
  const [profile, setProfile] = useState<AgencyProfile | null>(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [memberEmail, setMemberEmail] = useState("");
  const [memberName, setMemberName] = useState("");
  const [memberPassword, setMemberPassword] = useState("");

  useEffect(() => {
    let cancelled = false;
    void fetchAgencyProfile().then((p) => {
      if (cancelled) return;
      setProfile(p);
      setName(p?.name ?? "");
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    const res = await updateAgencyName(name.trim());
    setSaving(false);
    if ("error" in res) {
      toast(res.error, "error");
      return;
    }
    setProfile(res);
    toast("Nombre del despacho actualizado.", "success");
  }

  async function onLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setSaving(true);
    const res = await uploadAgencyLogo(file);
    setSaving(false);
    if ("error" in res) {
      toast(res.error, "error");
      return;
    }
    setProfile(res);
    toast("Logo actualizado. El cliente lo verá en el portal.", "success");
  }

  async function onAddMember(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await addAgencyMember({
      email: memberEmail,
      password: memberPassword,
      nombre: memberName,
    });
    setSaving(false);
    if ("error" in res) {
      toast(res.error, "error");
      return;
    }
    setProfile((prev) => (prev ? { ...prev, members: res } : prev));
    setMemberEmail("");
    setMemberName("");
    setMemberPassword("");
    toast("Miembro añadido. Ya puede entrar con ese email.", "success");
  }

  async function onRemove(member: AgencyMember) {
    setSaving(true);
    const res = await removeAgencyMember(member.id);
    setSaving(false);
    if ("error" in res) {
      toast(res.error, "error");
      return;
    }
    setProfile((prev) => (prev ? { ...prev, members: res } : prev));
    toast("Miembro quitado del equipo.", "success");
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-[var(--pw-muted)]">
        <Loader2 className="size-4 animate-spin" />
        Cargando despacho…
      </div>
    );
  }

  if (!profile) {
    return <p className="text-sm text-[var(--pw-danger)]">No se pudieron cargar los ajustes.</p>;
  }

  return (
    <div className="space-y-8">
      <section className="pathway-card border p-5">
        <h2 className="m-0 mb-1 text-base font-semibold">Marca del despacho</h2>
        <p className="m-0 mb-4 text-sm text-[var(--pw-muted)]">
          {profile.features?.whiteLabel === false
            ? "El nombre lo ve el cliente. El logo (marca blanca) está en el plan Profesional."
            : "Nombre y logo que ve el cliente en el portal y en el email del enlace."}
        </p>
        <form onSubmit={(e) => void saveName(e)} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="pathway-label" htmlFor="agency-name">
              Nombre
            </label>
            <input
              id="agency-name"
              className="pathway-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={saving}
            />
          </div>
          <div>
            <p className="pathway-label">Logo</p>
            {profile.features?.whiteLabel === false ? (
              <p className="m-0 mb-3 text-xs text-[var(--pw-muted)]">
                Pasa a Profesional para subir el logo del despacho.
              </p>
            ) : profile.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.logoUrl} alt="Logo del despacho" className="mb-3 h-12 object-contain" />
            ) : (
              <p className="m-0 mb-3 text-xs text-[var(--pw-muted)]">Aún no hay logo. Se usa PathWay.</p>
            )}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => void onLogo(e)}
              disabled={saving || profile.features?.whiteLabel === false}
            />
          </div>
          <div className="flex items-end">
            <button type="submit" className="pathway-btn pathway-btn-primary" disabled={saving}>
              {saving ? "Guardando…" : "Guardar nombre"}
            </button>
          </div>
        </form>
      </section>

      <section className="pathway-card border p-5">
        <h2 className="m-0 mb-1 text-base font-semibold">Equipo</h2>
        <p className="m-0 mb-4 text-sm text-[var(--pw-muted)]">
          Dueño: {profile.email}. Añade compañeros para que entren al mismo panel.
        </p>
        <ul className="m-0 mb-4 list-none space-y-2 p-0 text-sm">
          {profile.members.length === 0 ? (
            <li className="text-[var(--pw-muted)]">Todavía no hay más usuarios.</li>
          ) : (
            profile.members.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2" style={{ borderColor: "var(--pw-border)" }}>
                <span>
                  {m.nombre || m.email} <span className="text-[var(--pw-muted)]">({m.email})</span>
                </span>
                <button type="button" className="pathway-btn pathway-btn-ghost py-1 text-xs" onClick={() => void onRemove(m)} disabled={saving}>
                  Quitar
                </button>
              </li>
            ))
          )}
        </ul>
        <form onSubmit={(e) => void onAddMember(e)} className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="pathway-label" htmlFor="member-name">
              Nombre
            </label>
            <input id="member-name" className="pathway-input" value={memberName} onChange={(e) => setMemberName(e.target.value)} disabled={saving} />
          </div>
          <div>
            <label className="pathway-label" htmlFor="member-email">
              Email
            </label>
            <input
              id="member-email"
              type="email"
              className="pathway-input"
              value={memberEmail}
              onChange={(e) => setMemberEmail(e.target.value)}
              required
              disabled={saving}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="pathway-label" htmlFor="member-pass">
              Contraseña (mín. 8)
            </label>
            <input
              id="member-pass"
              type="password"
              className="pathway-input"
              value={memberPassword}
              onChange={(e) => setMemberPassword(e.target.value)}
              required
              minLength={8}
              disabled={saving}
            />
          </div>
          <div>
            <button type="submit" className="pathway-btn pathway-btn-primary" disabled={saving}>
              Añadir al equipo
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
