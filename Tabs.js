initializeButtonEvents();
const firstTabToOpen = "Skills";
handleTabs(firstTabToOpen);

function initializeButtonEvents()
{
    let tabButtons = document.querySelectorAll(".tablinks");

    for (let i = 0; i < tabButtons.length; i++) {

        let btn = tabButtons[i];

        console.log(btn);
        console.log(btn.innerHTML);

        btn.addEventListener("click", function(){
            handleTabs(btn.innerHTML);
        })
    }
}

function handleTabs(tabName)
{
    let tabContent;

    tabContent = document.getElementsByClassName("tabcontent");
    for (let i = 0; i < tabContent.length; i++) {
        
        let content = tabContent[i];
        
        if (content.id === tabName)
        {
            openTab(content);
        }
        else
        {
            closeTab(content);
        }
    }
}

function openTab(tab)
{
    let buttons;
    buttons = document.getElementsByClassName("tablinks");
    
    tab.style.display = "block";
 
    for (let i = 0; i < buttons.length; i++) {

        let btn = buttons[i];
        
        if (btn.innerHTML === tab.id)
        {
            btn.classList.add("active");
        }
        else
        {
            btn.classList.remove("active");
        }
    }
}

function closeTab(tab)
{
    tab.style.display = "none";
}