"use client"

import { useAppData, user_service } from '@/context/AppContext';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react'
import Cookies from 'js-cookie';
import axios from 'axios';
import toast from 'react-hot-toast';
import Loading from '@/components/Loading';
import { ArrowLeft, Edit3, Save, User, UserCircle } from 'lucide-react';

const ProfilePage = () => {
    const { user, isAuth, loading, setUser } = useAppData();

    const [isEdit, setIsEdit] = useState(false);
    const [name, setName] = useState<string | undefined>("");

    const router = useRouter();

    const editHandler = () => {
        setIsEdit(!isEdit);
        setName(user?.name);
    };

    const submitHandler = async (e: any) => {
        e.preventDefault();
        const token = Cookies.get("token");
        try {
            const { data } = await axios.post(`${user_service}/api/v1/update/user`, { name }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            Cookies.set("token", data.token, {
                expires: 15,
                secure: false,
                path: "/",
            });

            toast.success(data.message)
            setUser(data.user);
            setIsEdit(false);
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to update profile")
        }
    };

    useEffect(() => {
        if (!isAuth && !loading) {
            router.push("/login");
        }
    }, [isAuth, router, loading]);

    if (loading) return <Loading />;

    return (
        <div className='min-h-screen bg-gray-900 p-4'>
            <div className='max-w-2xl mx-auto pt-8'>
                <div className='flex items-center gap-4 mb-8'>
                    <button onClick={() => router.push("/chat")}
                        className='p-3 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 transition-colors'
                    >
                        <ArrowLeft className='w-5 h-5 text-gray-300' />
                    </button>
                    <div>
                        <h1 className='text-3xl font-bold text-white'>
                            Profile Settings
                        </h1>
                        <p className='text-gray-400 mt-1'>
                            Manage your account information
                        </p>
                    </div>
                </div>

                <div className='bg-gray-800 rounded-lg border border-gray-700 shadow-lg overflow-hidden'>
                    <div className='bg-gray-700/50 p-8 border-b border-gray-700 flex flex-col sm:flex-row items-start sm:items-center gap-6 relative'>
                        <div className='relative'>
                            <div className='w-20 h-20 rounded-full bg-gray-700 border border-gray-600 flex items-center justify-center overflow-hidden'>
                                <UserCircle className='w-14 h-14 text-gray-300' />
                            </div>
                            <div className='absolute bottom-0 right-0 w-5 h-5 bg-green-500 rounded-full border-2 border-gray-800'></div>
                        </div>
                        <div className='flex-1'>
                            <h2 className='text-2xl font-bold text-white mb-1'>{user?.name}</h2>
                            <p className='text-gray-400 text-sm'>
                                Joined <span className='font-medium text-gray-300'>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : ""}</span>
                            </p>
                        </div>
                    </div>

                    <div className='p-8'>
                        <div className='space-y-6'>
                            <div>
                                <div className='flex items-center justify-between mb-3'>
                                    <label className="block text-sm font-semibold text-gray-300">
                                        Display Name
                                    </label>
                                    {!isEdit && (
                                        <button
                                            onClick={editHandler}
                                            className='flex items-center gap-1.5 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors'
                                        >
                                            <Edit3 className='w-3.5 h-3.5' /> Edit
                                        </button>
                                    )}
                                </div>

                                {
                                    isEdit ? (
                                        <form onSubmit={submitHandler}
                                            className='space-y-4'
                                        >
                                            <div className="relative">
                                                <input type='text' value={name}
                                                    onChange={e => setName(e.target.value)}
                                                    className='w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500' />
                                                <User className='absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400' />
                                            </div>
                                            <div className='flex gap-3'>
                                                <button type='submit' className='flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors'>
                                                    <Save className='w-4 h-4' /> Save Changes
                                                </button>
                                                <button type='button' onClick={editHandler} className='px-6 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-300 font-semibold rounded-lg transition-colors'>
                                                    Cancel
                                                </button>
                                            </div>
                                        </form>
                                    ) : (
                                        <div className='w-full px-4 py-3 bg-gray-900/50 border border-gray-700/80 rounded-lg text-white flex items-center justify-between'>
                                            <span>{user?.name}</span>
                                        </div>
                                    )
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ProfilePage;