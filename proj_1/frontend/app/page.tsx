
import { redirect } from 'next/navigation';

const page = () => {
  return (
    //Gọi thẳng redirect("/chat") là Next.js tự động chuyển hướng người dùng sang trang /chat.
    redirect("/chat")
  )
}

export default page;