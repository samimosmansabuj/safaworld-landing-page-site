// ================= GLOBAL =================
let productsData = [];

// ================= FETCH PRODUCTS =================
async function loadProducts() {
    try {
        const res = await fetch(
            `${ENV.API_BASE_URL}/api/product-fetch/${ENV.PRODUCT_LANDING_PAGE_ID}/`
        );
        const result = await res.json();

        if (!result.status) {
            console.error("API failed");
            return;
        }

        productsData = result.data.map(p => {
            return {
                id: p.id,
                name: p.name,
                description: p.short_description || p.details || "",
                price: Number(p.discount_price) > 0
                    ? Number(p.discount_price)
                    : Number(p.price),
                image: p.primary_image
                    ? `${ENV.API_BASE_URL}${p.primary_image}`
                    : (p.images && p.images.length
                        ? `${ENV.API_BASE_URL}${p.images[0].image}`
                        : ""),
                variants: p.variants || []
            };
        });

        renderProducts();

    } catch (err) {
        console.error("Load error:", err);
    }
}

// ================= RENDER =================
function renderProducts() {
    const container = document.getElementById("products");
    container.innerHTML = "";

    productsData.forEach(product => {
        const div = document.createElement("div");
        div.className = "product-card";

        div.innerHTML = `
            <img src="${product.image}" alt="${product.name}" width="200">
            <h3>${product.name}</h3>
            <p>৳ ${product.price}</p>
            <button onclick="openProductDetail(${product.id})">View</button>
        `;

        container.appendChild(div);
    });
}

// ================= PRODUCT DETAIL =================
function openProductDetail(productId) {
    const product = productsData.find(p => p.id === productId);
    if (!product) return;

    document.getElementById("product-detail-modal").style.display = "flex";

    document.getElementById("detail-name").textContent = product.name;
    document.getElementById("detail-price").textContent = product.price;
    document.getElementById("detail-description").textContent =
        product.description;

    document.getElementById("main-detail-img").src = product.image;

    const sizeContainer = document.getElementById("detail-size");
    sizeContainer.innerHTML = "";

    if (product.variants.length > 0) {
        product.variants.forEach(v => {
            const btn = document.createElement("button");

            const sizeLabel = v.attributes?.size || "Option";

            btn.textContent = sizeLabel;

            btn.onclick = () => {
                document.querySelectorAll("#detail-size button")
                    .forEach(b => b.classList.remove("selected"));

                btn.classList.add("selected");

                btn.dataset.variantId = v.id;
                btn.dataset.price =
                    Number(v.discount_price) > 0
                        ? Number(v.discount_price)
                        : Number(v.price);
            };

            sizeContainer.appendChild(btn);
        });
    }

    document.getElementById("detail-buy-now").onclick = () =>
        submitOrder(product);
}

// ================= DELIVERY =================
function calculateDeliveryCharge(district) {
    district = district.toLowerCase().trim();
    if (district === "dhaka") return 60;
    if (district === "chattogram") return 120;
    return 150;
}

// ================= SUBMIT ORDER =================
async function submitOrder(product) {

    const selectedVariantBtn =
        document.querySelector("#detail-size .selected");

    let variantId = null;
    let unitPrice = product.price;

    if (selectedVariantBtn) {
        variantId = selectedVariantBtn.dataset.variantId;
        unitPrice = Number(selectedVariantBtn.dataset.price);
    }

    const quantity =
        Number(document.getElementById("modalQuantity")?.value) || 1;

    const name = document.getElementById("orderName").value.trim();
    const phone = document.getElementById("orderPhoneNumber").value.trim();
    const whatsapp =
        document.getElementById("orderWhatsappNumber")?.value.trim() || "";

    const address = document.getElementById("orderAddress").value.trim();
    const district = document.getElementById("deliverydistrict").value;

    if (!name || !phone || !address || !district) {
        alert("Please fill all required fields");
        return;
    }

    const subtotal = unitPrice * quantity;
    const delivery = calculateDeliveryCharge(district);
    const total = subtotal + delivery;

    const payload = {
        name,
        phone,
        whatsapp_number: whatsapp,
        address,
        district,
        product_id: product.id,
        variant_id: variantId,
        quantity,
        unit_price: unitPrice,
        subtotal,
        delivery,
        total,
        payment_type: "COD",
        payment_status: "Unpaid",
    };

    try {
        const res = await fetch(
            `${ENV.API_BASE_URL}/api/landing-page/order/create/`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            }
        );

        const result = await res.json();

        if (!res.ok) throw new Error(result.message);

        alert("Order placed successfully!");
        document.getElementById("product-detail-modal").style.display = "none";

    } catch (err) {
        console.error(err);
        alert("Order failed: " + err.message);
    }
}

// ================= INIT =================
document.addEventListener("DOMContentLoaded", () => {
    loadProducts();
});