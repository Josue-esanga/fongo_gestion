document.addEventListener("DOMContentLoaded", () => {
    const aside = document.querySelector("#aside");
    const section = document.querySelector("#section");
    const divs = document.querySelectorAll(".div");
    const menu = document.querySelector("#menu");
    const liens = document.querySelectorAll(".lien")

    menu.addEventListener("click", () => {
        aside.classList.toggle("w-[25%]");
        aside.classList.toggle("w-[5%]");
        section.classList.toggle("w-[75%]");
        section.classList.toggle("w-[100%]");
        
        divs.forEach(div => {
            div.classList.toggle("hidden");
            div.classList.toggle("relative");
            div.classList.toggle("left-0");
        });
        liens.forEach(lien=>{
            lien.classList.toggle("ml-0")
            lien.classList.toggle("pl-0")
        })
        
      
    });
});
