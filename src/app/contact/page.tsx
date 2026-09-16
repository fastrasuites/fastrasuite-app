"use client";
import { useState } from "react";
import Image from "next/image";
import { Grid, List } from "lucide-react";

export default function ContactPage() {
  const [isGridView, setIsGridView] = useState(true);

  const contacts = [
  { id: 1, name: "Name Surname", role: "Vendor", email: "email@email.com", image: "/images/avatar1.png" },
  { id: 2, name: "Name Surname", role: "Vendor", email: "email@email.com", image: "/images/avatar2.png" },
  { id: 3, name: "Name Surname", role: "Vendor", email: "email@email.com", image: "/images/avatar3.png" },
  { id: 4, name: "Name Surname", role: "Vendor", email: "email@email.com", image: "/images/avatar4.png" },
  { id: 5, name: "Name Surname", role: "Vendor", email: "email@email.com", image: "/images/avatar5.png" },
  { id: 6, name: "Name Surname", role: "Vendor", email: "email@email.com", image: "/images/avatar6.png" },
  { id: 7, name: "Name Surname", role: "Vendor", email: "email@email.com", image: "/images/avatar7.png" },
  { id: 8, name: "Name Surname", role: "Vendor", email: "email@email.com", image: "/images/avatar8.png" },
  { id: 9, name: "Name Surname", role: "Vendor", email: "email@email.com", image: "/images/avatar9.png" },
  { id: 10, name: "Name Surname", role: "Vendor", email: "email@email.com", image: "/images/avatar8.png" },
  { id: 11, name: "Name Surname", role: "Vendor", email: "email@email.com", image: "/images/avatar8.png" },
  { id: 12, name: "Name Surname", role: "Vendor", email: "email@email.com", image: "/images/avatar6.png" },
  { id: 13, name: "Name Surname", role: "Vendor", email: "email@email.com", image: "/images/avatar9.png" },
  { id: 14, name: "Name Surname", role: "Vendor", email: "email@email.com", image: "/images/avatar7.png" },
  { id: 15, name: "Name Surname", role: "Vendor", email: "email@email.com", image: "/images/avatar8.png" },
  
];


  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2 w-full sm:w-1/3">
          <input
            type="text"
            placeholder="Search"
            className="w-full outline-none text-gray-600 text-sm"
          />
        </div>

        <div className="flex items-center gap-3">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition">
            New Contact
          </button>

          <div className="flex items-center border rounded-md overflow-hidden">
            <button
              onClick={() => setIsGridView(true)}
              className={`p-2 ${
                isGridView ? "bg-gray-100" : "hover:bg-gray-50"
              }`}
            >
              <Grid className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => setIsGridView(false)}
              className={`p-2 ${
                !isGridView ? "bg-gray-100" : "hover:bg-gray-50"
              }`}
            >
              <List className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Contacts grid */}
      {isGridView ? (
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className="bg-white rounded-lg border shadow-sm hover:shadow-md transition cursor-pointer flex flex-col items-center p-6"
            >
            <Image
              src={contact.image}
              alt={contact.name}
              width={80}
              height={80}
              className="rounded-full mb-4"
            />

            <h3 className="font-medium text-gray-800">{contact.name}</h3>
            <p className="text-gray-500 text-sm">{contact.role}</p>
            <p className="text-gray-400 text-sm mt-1">{contact.email}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border rounded-lg p-4 text-center text-gray-500">
          List view placeholder (coming soon)
        </div>
      )}
    </div>
  );
}
