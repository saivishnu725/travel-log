let expenses = [];
let totalCost = 0;

// Fetch and populate data on page load
document.addEventListener('DOMContentLoaded', () => {
    fetch('/retrieve-data')
        .then(response => response.json())
        .then(data => {
            populateData(data);
        })
        .catch(error => console.error('Error retrieving data:', error));
});

function populateData(data) {
    // Populate budget tracker
    document.getElementById('num-people').value = data.budgetTracker.numPeople || '';
    expenses = data.budgetTracker.expenses || [];
    totalCost = data.budgetTracker.totalCost || 0;
    updateExpenses();
    document.getElementById('cost-per-person').textContent = data.budgetTracker.costPerPerson || '0';

    // Populate places visited
    const placesList = document.getElementById('places-list');
    placesList.innerHTML = ''; // Clear existing items
    data.placesVisited?.forEach(place => {
        const li = document.createElement('li');
        li.innerHTML = `${place.place}: <a href="${place.mapLink}" target="_blank">${place.mapLink}</a>`;
        placesList.appendChild(li);
    });

    // Populate to-do list
    const todoList = document.getElementById('todo-list-items');
    todoList.innerHTML = ''; // Clear existing items
    data.todoList?.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item;
        todoList.appendChild(li);
    });

    // Populate backup plans
    const backupPlansList = document.getElementById('backup-plans-list');
    backupPlansList.innerHTML = ''; // Clear existing items
    data.backupPlans?.forEach(plan => {
        const li = document.createElement('li');
        li.textContent = plan;
        backupPlansList.appendChild(li);
    });

    // Populate contact information
    const contactInfoList = document.getElementById('contact-info-list');
    contactInfoList.innerHTML = ''; // Clear existing items
    data.contactInfo?.forEach(contact => {
        const li = document.createElement('li');
        li.textContent = `${contact.name}: ${contact.info} (Reason: ${contact.reason})`;
        contactInfoList.appendChild(li);
    });

    // Populate items spent
    const spentList = document.getElementById('spent-list');
    spentList.innerHTML = ''; // Clear existing items
    data.itemSpent?.forEach(item => {
        const li = document.createElement('li');
        li.textContent = `${item.userName} spent on ${item.item}: $${item.cost}`;
        spentList.appendChild(li);
    });
}


function addExpense() {
    const item = document.getElementById('item').value;
    const cost = parseFloat(document.getElementById('cost').value);
    expenses.push({ item, cost });
    totalCost += cost;
    updateExpenses();
    saveData();
}

function updateExpenses() {
    const expensesList = document.getElementById('expenses-list');
    expensesList.innerHTML = '';
    expenses.forEach(expense => {
        const li = document.createElement('li');
        li.textContent = `${expense.item}: ₹${expense.cost}`;
        expensesList.appendChild(li);
    });
    document.getElementById('total-cost').textContent = totalCost;
    const numPeople = parseFloat(document.getElementById('num-people').value) || 1;
    document.getElementById('cost-per-person').textContent = (totalCost / numPeople).toFixed(2);
}

function addPlace() {
    const place = document.getElementById('place').value;
    const mapLink = document.getElementById('map-link').value;
    const placesList = document.getElementById('places-list');
    const li = document.createElement('li');
    li.innerHTML = `${place}: <a href="${mapLink}" target="_blank">${mapLink}</a>`;
    placesList.appendChild(li);
    saveData();
}

function uploadFiles() {
    const tag = document.getElementById('folder-tag').value;
    const files = document.getElementById('file-upload').files;
    const formData = new FormData();
    formData.append('tag', tag);
    for (const element of files)
        formData.append('files', element);
    fetch('/upload', {
        method: 'POST',
        body: formData,
    }).then(response => response.json()).then(data => {
        alert('Files uploaded successfully');
    }).catch(error => {
        console.error('Error:', error);
    });
}

function downloadZip() {
    const tag = document.getElementById('zip-tag').value;
    fetch(`/zip?tag=${tag}`, {
        method: 'GET',
    }).then(response => {
        if (response.ok) {
            return response.blob();
        }
        throw new Error('Failed to create zip');
    }).then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `${tag}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
    }).catch(error => {
        console.error('Error:', error);
        alert('Failed to create zip: ' + error.message);
    });
}

function addTodo() {
    const item = document.getElementById('todo-item').value;
    const todoList = document.getElementById('todo-list-items');
    const li = document.createElement('li');
    li.textContent = item;
    todoList.appendChild(li);
    saveData();
}

function addBackupPlan() {
    const plan = document.getElementById('backup-plan').value;
    const backupPlansList = document.getElementById('backup-plans-list');
    const li = document.createElement('li');
    li.textContent = plan;
    backupPlansList.appendChild(li);
    saveData();
}

function addContact() {
    const name = document.getElementById('contact-name').value;
    const info = document.getElementById('contact-info-input').value;
    const reason = document.getElementById('contact-reason').value;
    const contactInfoList = document.getElementById('contact-info-list');
    const li = document.createElement('li');
    li.textContent = `${name}: ${info} (Reason: ${reason})`;
    contactInfoList.appendChild(li);
    saveData();
}

function addSpentItem() {
    const userName = document.getElementById('user-name').value;
    const spentItem = document.getElementById('spent-item').value;
    const spentCost = parseFloat(document.getElementById('spent-cost').value);
    const spentList = document.getElementById('spent-list');
    const li = document.createElement('li');
    li.textContent = `${userName} spent on ${spentItem}: $${spentCost}`;
    spentList.appendChild(li);
    saveData();
}


// Function to collect data from all sections
function collectData() {
    const data = {
        budgetTracker: collectBudgetTrackerData(),
        placesVisited: collectPlacesVisitedData(),
        todoList: collectTodoListData(),
        backupPlans: collectBackupPlansData(),
        contactInfo: collectContactInfoData(),
        itemSpent: collectItemSpentData(),
    };
    return data;
}

// Function to collect data from the budget tracker section
function collectBudgetTrackerData() {
    const numPeople = document.getElementById('num-people').value;
    const expenses = [];
    const expenseElements = document.querySelectorAll('#expenses-list li');
    expenseElements.forEach(element => {
        const parts = element.textContent.split(': $');
        const item = parts[0];
        const cost = parseFloat(parts[1]);
        expenses.push({ item, cost });
    });
    const totalCost = parseFloat(document.getElementById('total-cost').textContent);
    const costPerPerson = parseFloat(document.getElementById('cost-per-person').textContent);
    return { numPeople, expenses, totalCost, costPerPerson };
}

// Function to collect data from the places visited section
function collectPlacesVisitedData() {
    const places = [];
    const placeElements = document.querySelectorAll('#places-list li');
    placeElements.forEach(element => {
        const parts = element.textContent.split(': ');
        const place = parts[0];
        const mapLink = parts[1];
        places.push({ place, mapLink });
    });
    return places;
}

// Function to collect data from the to-do list section
function collectTodoListData() {
    const todoItems = [];
    const todoItemElements = document.querySelectorAll('#todo-list-items li');
    todoItemElements.forEach(element => {
        todoItems.push(element.textContent);
    });
    return todoItems;
}

// Function to collect data from the backup plans section
function collectBackupPlansData() {
    const backupPlans = [];
    const backupPlanElements = document.querySelectorAll('#backup-plans-list li');
    backupPlanElements.forEach(element => {
        backupPlans.push(element.textContent);
    });
    return backupPlans;
}

// Function to collect data from the contact information section
function collectContactInfoData() {
    const contacts = [];
    const contactElements = document.querySelectorAll('#contact-info-list li');
    contactElements.forEach(element => {
        const parts = element.textContent.split(' (Reason: ');
        if (parts.length === 2) {
            const nameInfo = parts[0].split(': ');
            const name = nameInfo[0];
            const info = nameInfo[1];
            const reason = parts[1].slice(0, -1); // Remove the trailing ')'
            contacts.push({ name, info, reason });
        }
    });
    return contacts;
}

// Function to collect data from the items spent section
function collectItemSpentData() {
    const spentItems = [];
    const spentItemElements = document.querySelectorAll('#spent-list li');
    spentItemElements.forEach(element => {
        const parts = element.textContent.split(' spent on ');
        const userName = parts[0];
        const item = parts[1].split(': $')[0];
        const cost = parseFloat(parts[1].split(': $')[1]);
        spentItems.push({ userName, item, cost });
    });
    return spentItems;
}

// Set the interval for saving data (e.g., every 30 seconds)
function saveData() {
    const dataToSave = collectData();

    // Send a POST request to save the data
    fetch('/save-data', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSave),
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to save data');
            }
            console.log('Data saved successfully');
        })
        .catch(error => {
            console.error('Error saving data:', error);
        });
}
