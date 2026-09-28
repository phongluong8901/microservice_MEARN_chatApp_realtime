"use client";

import Loading from "@/components/Loading";
import VerifyOtp from "@/components/VerifyOtp";
import { Suspense } from "react";

const VerifyPage = () => {

    return (
        // Bọc component con trong Suspense, hiển thị <Loading /> trong lúc chờ
        <Suspense fallback={<Loading />}>
            <VerifyOtp />
        </Suspense>
    );
};

export default VerifyPage;

