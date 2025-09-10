
"use client";

import dynamic from "next/dynamic";

const Toaster = dynamic(() => import("./ui/Toaster"), { ssr: false });

export default function ClientToaster() {
	return <Toaster />;
}
