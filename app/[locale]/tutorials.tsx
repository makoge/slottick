import { useState } from "react"

export default function App() {
   const [age, setAge] = useState<number>(0)

   const handleChange = (e: React.ChangeEvent<HTMLInputElement>)=> { setAge(Number(e.target.value))}
return (
  <div>
     <input type="number" value={age} onChange={handleChange}  />
     <p>{age}</p>
</div>
)
}



/*import { title } from "process";
import { types } from "util";

type BlogPost = {
  title: string
  views: number
  status: "draft"| "published"
}

const posts: BlogPost[] = [
  {title:"post 1", views: 500, status: "draft"},
  {title: "post 2", views: 1500, status: "published"},
  {title:"post 3", views: 2000, status:"published"}
]

function getHigherViews(posts: BlogPost[]): BlogPost[] {
      return posts.filter(BlogPost => BlogPost.views>1000 && BlogPost.status === "published")
}


/*function getPostStatus(post: blogPost): string {
  if (post.status === "published" && post.views > 1000) {
         return "published & popular"
  }
  else if(post.status === "published" && post.views <= 1000){
    return "published & normal"
  }
  else if (post.status === "draft" && post.views > 1000){
    return "draft & popular"
  }else{
    return "draft && nromal"
  }
}

type user ={
  name: string
  age: number
}

const users: user[] = [
  {name: "ocean", age: 25},
  {name: "alex", age:30}
]

function getOlderUsers(users: user[]): user[] {
      return users.filter( user => user.name === "ocean")
}*/