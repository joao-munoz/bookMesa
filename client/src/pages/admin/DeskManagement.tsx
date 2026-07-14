import { useState } from "react";
import { useDesks, useCreateDesk, useUpdateDesk, useDeleteDesk, type Desk } from "../../hooks/useDesks";
import { Card, CardContent, CardHeader } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Modal } from "../../components/ui/modal";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Loader2, Plus, Pencil, Trash2, MapPin } from "lucide-react";

export default function DeskManagement() {
  const { data: desks, isLoading } = useDesks();
  const createDesk = useCreateDesk();
  const updateDesk = useUpdateDesk();
  const deleteDesk = useDeleteDesk();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Desk | null>(null);
  const [form, setForm] = useState({ label: "", x: 0, y: 0, width: 100, height: 60, rotation: 0, isActive: true });

  const openCreate = () => {
    setEditing(null);
    setForm({ label: "", x: 0, y: 0, width: 100, height: 60, rotation: 0, isActive: true });
    setShowModal(true);
  };

  const openEdit = (desk: Desk) => {
    setEditing(desk);
    setForm({ label: desk.label, x: desk.x, y: desk.y, width: desk.width, height: desk.height, rotation: desk.rotation, isActive: desk.isActive });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (editing) {
        await updateDesk.mutateAsync({ id: editing.id, ...form });
      } else {
        await createDesk.mutateAsync(form);
      }
      setShowModal(false);
    } catch (err: any) {
      alert(err.response?.data?.error || "Erro ao salvar");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-accent" size={32} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display text-primary">Gerenciar Mesas</h1>
          <p className="text-sm text-muted mt-1">{desks?.length || 0} mesas cadastradas</p>
        </div>
        <Button onClick={openCreate} variant="primary">
          <Plus size={16} className="mr-1" /> Nova Mesa
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {desks?.map((desk) => (
          <Card key={desk.id} className={`border ${desk.isActive ? "border-border" : "border-dashed border-muted/30"}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-md bg-accent/10 flex items-center justify-center">
                    <MapPin size={16} className="text-accent" />
                  </div>
                  <span className="font-medium">{desk.label}</span>
                </div>
                <Badge variant={desk.isActive ? "success" : "default"}>
                  {desk.isActive ? "Ativa" : "Inativa"}
                </Badge>
              </div>
              <div className="text-xs text-muted space-y-1">
                <p>Posição: ({desk.x}, {desk.y})</p>
                <p>Tamanho: {desk.width} × {desk.height}</p>
              </div>
              <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(desk)}>
                  <Pencil size={14} className="mr-1" /> Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-danger hover:text-danger"
                  onClick={() => {
                    if (confirm(`Excluir mesa ${desk.label}?`)) {
                      deleteDesk.mutate(desk.id);
                    }
                  }}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? `Editar Mesa ${editing.label}` : "Nova Mesa"}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Label" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} id="label" />
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Input label="Ativo" id="active" readOnly />
              </div>
              <button
                type="button"
                onClick={() => setForm({ ...form, isActive: !form.isActive })}
                className={`h-10 px-3 rounded-md border text-sm transition-colors ${
                  form.isActive
                    ? "bg-success/10 border-success text-success"
                    : "bg-muted/10 border-border text-muted"
                }`}
              >
                {form.isActive ? "Sim" : "Não"}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="X" type="number" value={form.x} onChange={(e) => setForm({ ...form, x: Number(e.target.value) })} id="x" />
            <Input label="Y" type="number" value={form.y} onChange={(e) => setForm({ ...form, y: Number(e.target.value) })} id="y" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Largura" type="number" value={form.width} onChange={(e) => setForm({ ...form, width: Number(e.target.value) })} id="w" />
            <Input label="Altura" type="number" value={form.height} onChange={(e) => setForm({ ...form, height: Number(e.target.value) })} id="h" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={createDesk.isPending || updateDesk.isPending}>
              {editing ? "Salvar" : "Criar"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
