import { useState } from "react";
import { useRooms, useCreateRoom, useUpdateRoom, useDeleteRoom } from "../../hooks/useRooms";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Modal } from "../../components/ui/modal";
import { ConfirmModal } from "../../components/ui/ConfirmModal";
import { Loader2, Plus, DoorOpen, Trash2, Power, PowerOff } from "lucide-react";

export default function RoomManagement() {
  const { data: rooms, isLoading } = useRooms();
  const createRoom = useCreateRoom();
  const updateRoom = useUpdateRoom();
  const deleteRoom = useDeleteRoom();

  const [showCreate, setShowCreate] = useState(false);
  const [editRoom, setEditRoom] = useState<any>(null);
  const [name, setName] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const resetForm = () => setName("");

  const handleCreate = async () => {
    if (!name.trim()) return;
    try {
      await createRoom.mutateAsync({ name: name.trim() });
      setShowCreate(false);
      resetForm();
    } catch {}
  };

  const handleEdit = async () => {
    if (!editRoom || !name.trim()) return;
    try {
      await updateRoom.mutateAsync({ id: editRoom.id, name: name.trim() });
      setEditRoom(null);
      resetForm();
    } catch {}
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
          <h1 className="text-2xl font-display text-primary">Gerenciar Salas</h1>
          <p className="text-sm text-muted mt-1">{rooms?.length || 0} sala(s) cadastrada(s)</p>
        </div>
        <Button
          variant="primary"
          onClick={() => { resetForm(); setShowCreate(true); }}
        >
          <Plus size={16} className="mr-1" /> nova sala
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms?.map((room) => (
          <Card key={room.id} className={!room.isActive ? "opacity-60" : ""}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <DoorOpen size={18} className="text-accent" />
                  <span className="font-semibold">{room.name}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setName(room.name);
                    setEditRoom(room);
                  }}
                >
                  editar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted hover:text-info"
                  onClick={() => updateRoom.mutate({ id: room.id, isActive: !room.isActive })}
                >
                  {room.isActive ? <PowerOff size={14} /> : <Power size={14} />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted hover:text-danger"
                  onClick={() => setConfirmDelete(room.id)}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Modal
        open={showCreate}
        onClose={() => { setShowCreate(false); resetForm(); }}
        title="Nova sala"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#2C2C2C] mb-1">nome</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
              placeholder="ex: Sala de Reunião"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => { setShowCreate(false); resetForm(); }}>cancelar</Button>
            <Button variant="primary" onClick={handleCreate} disabled={createRoom.isPending || !name.trim()}>
              {createRoom.isPending ? "criando..." : "criar sala"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!editRoom}
        onClose={() => { setEditRoom(null); resetForm(); }}
        title="Editar sala"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#2C2C2C] mb-1">nome</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => { setEditRoom(null); resetForm(); }}>cancelar</Button>
            <Button variant="primary" onClick={handleEdit} disabled={updateRoom.isPending || !name.trim()}>
              {updateRoom.isPending ? "salvando..." : "salvar"}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) {
            deleteRoom.mutate(confirmDelete);
            setConfirmDelete(null);
          }
        }}
        title="Excluir sala"
        message="Tem certeza que deseja excluir esta sala? Todas as reservas associadas serão removidas."
        confirmText="excluir"
        variant="danger"
        loading={deleteRoom.isPending}
      />
    </div>
  );
}
