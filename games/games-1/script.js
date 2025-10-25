const pilihan = ['batu', 'gunting', 'kertas'];
const buttons = document.querySelectorAll('.choices button');
const resultDiv = document.getElementById('result');

function getPilihanKomputer() {
    const randomIndex = Math.floor(Math.random() * pilihan.length);
    return pilihan[randomIndex];
}

function getResult(pemain, komputer) {
    if (pemain === komputer) return 'SERI!';
    if (
        (pemain === 'batu' && komputer === 'gunting') ||
        (pemain === 'gunting' && komputer === 'kertas') ||
        (pemain === 'kertas' && komputer === 'batu')
    ) {
        return 'KAMU MENANG! 🎉';
    }
    return 'KAMU KALAH! 😢';
}

buttons.forEach(button => {
    button.addEventListener('click', () => {
        const pilihanPemain = button.id;
        const pilihanKomputer = getPilihanKomputer();
        const hasil = getResult(pilihanPemain, pilihanKomputer);

        resultDiv.innerHTML = `
            <p>Kamu memilih: <strong>${pilihanPemain.toUpperCase()}</strong></p>
            <p>Komputer memilih: <strong>${pilihanKomputer.toUpperCase()}</strong></p>
            <hr>
            <p>${hasil}</p>
        `;
    });
});