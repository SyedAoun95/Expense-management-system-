
"use client";
// debit not page created still settings needed to be made in that page
import React, { useEffect, useState } from "react";
import { initDB } from "../services/db";

export default function CashReceivedPage() {
	const [db, setDb] = useState<any>(null);
	const [areas, setAreas] = useState<any[]>([]);
	const [selectedArea, setSelectedArea] = useState("");
	const [personsInArea, setPersonsInArea] = useState<any[]>([]);
	const [selectedPersonId, setSelectedPersonId] = useState("");
	const [selectedPersonName, setSelectedPersonName] = useState("");
	const [selectedMonth, setSelectedMonth] = useState("");
	const [amount, setAmount] = useState<number | "">("");
	const [records, setRecords] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [connectionQuery, setConnectionQuery] = useState("");
	const [connectionSuggestions, setConnectionSuggestions] = useState<any[]>([]);
	const [areaQuery, setAreaQuery] = useState("");
	const [areaSuggestions, setAreaSuggestions] = useState<any[]>([]);

	useEffect(() => {
		const setup = async () => {
			const pouch = await initDB();
			if (!pouch) return;
			setDb(pouch);
			try {
				const a = await pouch.getAreas();
				setAreas(a || []);
			} catch (e) {
				console.warn("failed to load areas", e);
			}
			setLoading(false);
		};
		setup();
	}, []);

	const onAreaChange = async (areaId: string) => {
		setSelectedArea(areaId);
		setSelectedPersonId("");
		setSelectedPersonName("");
		setRecords([]);
		setConnectionQuery("");
		setConnectionSuggestions([]);
		if (!db || !areaId) return;
		try {
			const p = await db.getPersonsByArea(areaId);
			setPersonsInArea(p || []);
			await loadRecords(areaId);
		} catch (e) {
			console.warn("failed to load persons/records", e);
		}
	};

	const onPersonSelect = (personId: string) => {
		setSelectedPersonId(personId);
		const person = personsInArea.find((x) => x._id === personId);
		setSelectedPersonName(person?.name || "");
		setConnectionSuggestions([]);
		setConnectionQuery(person ? String(person.connectionNumber ?? person.number ?? person.name ?? "") : "");
	};

	const loadRecords = async (areaId: string) => {
		if (!db) return;
		try {
			await db.localDB.createIndex({ index: { fields: ["type", "areaId"] } });
			const res = await db.localDB.find({ selector: { type: "debit", areaId } });
			setRecords(res.docs || []);
		} catch (e) {
			console.warn("failed to load records", e);
		}
	};

	const addRecord = async () => {
		if (!db) return;
		if (!selectedArea) {
			alert("Please select an area");
			return;
		}
		if (!selectedPersonId) {
			alert("Please select a connection number (person)");
			return;
		}
		if (!selectedMonth) {
			alert("Please choose a month");
			return;
		}
		if (amount === "" || Number.isNaN(Number(amount)) || Number(amount) <= 0) {
			alert("Please enter a valid amount");
			return;
		}

		const doc: any = {
			_id: `debit_${selectedArea}_${selectedPersonId}_${Date.now()}`,
			type: "debit",
			areaId: selectedArea,
			personId: selectedPersonId,
			personName: selectedPersonName,
			month: selectedMonth,
			amount: Number(amount),
			createdAt: new Date().toISOString(),
		};

		try {
			await db.localDB.put(doc);
			await loadRecords(selectedArea);
			setAmount("");
			setSelectedMonth("");
		} catch (e: any) {
			console.error("failed to save record", e);
			alert(e?.message || "Failed to save record");
		}
	};

	const deleteRecord = async (r: any) => {
		if (!db) return;
		try {
			await db.localDB.remove(r);
			await loadRecords(selectedArea);
		} catch (e) {
			console.warn("failed to delete record", e);
		}
	};

	if (loading)
		return (
			<div className="flex items-center justify-center min-h-screen bg-gray-50">
				<div className="text-lg text-gray-600">Loading...</div>
			</div>
		);

	return (
		<div className="min-h-screen bg-gray-50 p-6">
			<div className="mb-6">
				<h1 className="text-2xl font-bold text-black">Cash Received From Customer</h1>
				<p className="text-sm text-gray-600">Enter received amounts per person and month</p>
			</div>

			<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
				<div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
					<div className="md:col-span-1">
						<label className="block text-sm font-medium text-gray-700 mb-2">Area</label>
						<div className="relative">
							<input
								type="text"
								value={areaQuery}
								onChange={(e) => {
									const q = String(e.target.value || "");
									setAreaQuery(q);
									if (!q) {
										setAreaSuggestions([]);
										return;
									}
									const qLower = q.toLowerCase();
									const filtered = areas.filter((ar) => String(ar.name || "").toLowerCase().startsWith(qLower));
									setAreaSuggestions(filtered.slice(0, 20));
								}}
								placeholder="Type area name (e.g. K for Karachi)"
								className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
							/>
							{areaSuggestions.length > 0 && (
								<ul className="absolute z-10 left-0 right-0 mt-1 bg-white border border-gray-200 rounded max-h-44 overflow-auto shadow-lg">
									{areaSuggestions.map((a) => (
										<li
											key={a._id}
											onClick={() => {
												setAreaQuery(a.name || "");
												setAreaSuggestions([]);
												onAreaChange(a._id);
											}}
											className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm text-black"
										>
											{a.name}
										</li>
									))}
								</ul>
							)}
						</div>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">Connection No</label>
						<div className="relative">
							<input
								type="text"
								value={connectionQuery}
								onChange={(e) => {
									const q = String(e.target.value || "");
									setConnectionQuery(q);
									if (!q) {
										setConnectionSuggestions([]);
										return;
									}
									const qLower = q.toLowerCase();
									const filtered = personsInArea.filter((p) => {
										const conn = String(p.connectionNumber ?? p.number ?? p.name ?? "");
										return conn.toLowerCase().startsWith(qLower);
									});
									setConnectionSuggestions(filtered.slice(0, 20));
								}}
								placeholder="Type connection # (e.g. 1)"
								className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
							/>

							{connectionSuggestions.length > 0 && (
								<ul className="absolute z-10 left-0 right-0 mt-1 bg-white border border-gray-200 rounded max-h-44 overflow-auto shadow-lg">
									{connectionSuggestions.map((p) => {
										const label = p.connectionNumber ?? p.number ?? p.name ?? "";
										return (
											<li
												key={p._id}
												onClick={() => onPersonSelect(p._id)}
												className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm text-black"
											>
												{label}
											</li>
										);
									})}
								</ul>
							)}
						</div>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">Person Name</label>
						<input type="text" value={selectedPersonName} readOnly className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-black" />
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
						<input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg text-black" />
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
						<input type="number" value={amount === "" ? "" : amount} onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))} placeholder="0.00" className="w-full px-4 py-3 border border-gray-300 rounded-lg text-black" />
					</div>
				</div>

				<div className="mt-4">
					<button onClick={addRecord} className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-700 text-white rounded-lg hover:from-blue-700 hover:to-purple-800">Add Record</button>
				</div>
			</div>

			<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
				<h2 className="text-lg font-semibold mb-4">Records</h2>
				{records.length === 0 ? (
					<div className="text-sm text-gray-500">No records for selected area</div>
				) : (
					<div className="overflow-x-auto">
						<table className="min-w-full divide-y divide-gray-200">
							<thead className="bg-gray-50">
								<tr>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Person</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
								</tr>
							</thead>
							<tbody className="bg-white divide-y divide-gray-200">
								{records.map((r: any) => (
									<tr key={r._id}>
										<td className="px-6 py-3 text-sm text-gray-900">{r.personName}</td>
										<td className="px-6 py-3 text-sm text-gray-500">{r.month}</td>
										<td className="px-6 py-3 text-sm text-gray-500">${Number(r.amount).toFixed(2)}</td>
										<td className="px-6 py-3 text-sm">
											<button onClick={() => deleteRecord(r)} className="text-red-600">Delete</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</div>
	);
}
