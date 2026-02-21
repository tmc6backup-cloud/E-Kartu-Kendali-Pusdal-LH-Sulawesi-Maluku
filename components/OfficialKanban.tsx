import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import {
    Stamp,
    GanttChart,
    FileSearch,
    Coins,
    UserCheck,
} from 'lucide-react';

interface Official {
    id: string;
    name: string;
}

interface RoleColumn {
    name: string;
    officials: Official[];
    icon: React.ReactNode;
}

const initialData: { [key: string]: RoleColumn } = {
    'kpa': { name: 'Kuasa Pengguna Anggaran', officials: [{ id: '1', name: 'Dr. John Doe' }], icon: <UserCheck size={20} /> },
    'validator_program': { name: 'Validator Program', officials: [{ id: '2', name: 'Jane Smith' }], icon: <GanttChart size={20} /> },
    'validator_tu': { name: 'Kasubag Tata Usaha', officials: [], icon: <FileSearch size={20} /> },
    'validator_ppk': { name: 'Pejabat PPK', officials: [{ id: '3', name: 'Peter Jones' }], icon: <Stamp size={20} /> },
    'bendahara': { name: 'Bendahara', officials: [{ id: '4', name: 'Mary Jane' }], icon: <Coins size={20} /> },
};

const OfficialKanban: React.FC = () => {
    const [columns, setColumns] = useState(initialData);

    const onDragEnd = (result: DropResult) => {
        const { source, destination } = result;
        if (!destination) return;

        if (source.droppableId === destination.droppableId) {
            // Memindahkan di dalam kolom yang sama (belum diimplementasikan)
        } else {
            // Memindahkan ke kolom yang berbeda
            const sourceColumn = columns[source.droppableId];
            const destColumn = columns[destination.droppableId];
            const sourceOfficials = [...sourceColumn.officials];
            const destOfficials = [...destColumn.officials];
            const [removed] = sourceOfficials.splice(source.index, 1);
            destOfficials.splice(destination.index, 0, removed);

            setColumns({
                ...columns,
                [source.droppableId]: {
                    ...sourceColumn,
                    officials: sourceOfficials,
                },
                [destination.droppableId]: {
                    ...destColumn,
                    officials: destOfficials,
                },
            });
        }
    };

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                {Object.entries(columns).map(([columnId, column]) => (
                    <Droppable droppableId={columnId} key={columnId}>
                        {(provided, snapshot) => (
                            <div
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                                className={`p-4 rounded-2xl bg-slate-50 border ${snapshot.isDraggingOver ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200'}`}>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center border border-slate-200 text-blue-600">
                                            {column.icon}
                                        </div>
                                        <h3 className="font-black text-xs uppercase tracking-wider text-slate-600">{column.name}</h3>
                                    </div>
                                    <div className="text-xs font-bold text-slate-400 bg-white px-2 py-1 rounded-md border border-slate-200">
                                        {column.officials.length}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                {column.officials.map((official, index) => (
                                    <Draggable key={official.id} draggableId={official.id} index={index}>
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                                className={`p-4 rounded-xl shadow-sm flex items-center gap-3 ${snapshot.isDragging ? 'bg-blue-100 border-blue-300 border' : 'bg-white border-slate-100 border'}`}>
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                                                    {official.name.charAt(0)}
                                                </div>
                                                <span className="text-xs font-bold text-slate-800">{official.name}</span>
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                                </div>
                        )}
                    </Droppable>
                ))}
            </div>
        </DragDropContext>
    );
};

export default OfficialKanban;
