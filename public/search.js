const root = document.querySelector(".root");
let add = document.querySelector("form button");

add.addEventListener("click", (e) => {
  //prevent form from submitting
  e.preventDefault();
  //get input from form
  let form = e.target.parentElement;

  let query_String = form.children[0].value;
  if (query_String === "") {
    query_String = "LorumIpsum99";
  }
  let result = document.createElement("div");
  result.classList.add("new_event");
  let text = document.createElement("p");
  text.classList.add("what");
  text.innerText = event;
  let time = document.createElement("p");
  time.classList.add("when");
  time.innerText = month + "/" + date;
  todo.appendChild(text);
  todo.appendChild(time);

  //for local storage edit and save
  let eventToLocalStorage = {
    event: event,
    month: month,
    date: date,
  };
  let myList = localStorage.getItem("list");
  if (myList === null) {
    localStorage.setItem("list", JSON.stringify([eventToLocalStorage]));
  } else {
    let arr = JSON.parse(myList);
    arr.push(eventToLocalStorage);
    localStorage.setItem("list", JSON.stringify(arr));
  }

  // create check and delete buttons and icon v and x for them
  let checkBox = document.createElement("button");
  checkBox.classList.add("check");
  checkBox.innerHTML = '<i class="fas fa-check-circle"></i>';
  checkBox.addEventListener("click", (e) => {
    e.target.parentElement.classList.toggle("done");
  });

  let deleteButton = document.createElement("button");
  deleteButton.classList.add("del");
  deleteButton.innerHTML = '<i class="fas fa-trash-alt"></i>';
  deleteButton.addEventListener("click", (e) => {
    let delItem = e.target.parentElement;
    delItem.style.animation = "scaleDown 0.25s forwards";
    delItem.addEventListener("animationend", () => {
      let text = delItem.children[0].innerText;
      let arr = JSON.parse(localStorage.getItem("list"));
      arr.forEach((ele, index) => {
        if (ele.event == text) {
          arr.splice(index, 1);
          localStorage.setItem("list", JSON.stringify(arr));
        }
      });
      delItem.remove();
    });
  });

  todo.appendChild(checkBox);
  todo.appendChild(deleteButton);

  form.children[0].value = "";
  form.children[1].value = "";
  form.children[2].value = "";
  todo.style.animation = "scaleUP 0.5s forwards";
  section.appendChild(todo);
});
