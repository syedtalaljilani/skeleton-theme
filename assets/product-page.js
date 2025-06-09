// Product page functionality
document.addEventListener("DOMContentLoaded", function () {
  // Image gallery
  function updateMainImage(thumbnail) {
    const mainImage = document.getElementById("main-product-image");
    const fullImageUrl = thumbnail.dataset.fullImg;
    const thumbnails = document.querySelectorAll(".thumbnail-item");

    // Update main image
    mainImage.src = fullImageUrl;

    // Update active thumbnail
    thumbnails.forEach((item) => item.classList.remove("active"));
    thumbnail.parentNode.classList.add("active");
  }

  // Make the updateMainImage function available globally
  window.updateMainImage = updateMainImage;

  // Quantity selectors
  const quantityInput = document.querySelector("[data-quantity-input]");
  const minusButton = document.querySelector("[data-quantity-minus]");
  const plusButton = document.querySelector("[data-quantity-plus]");

  if (minusButton && quantityInput) {
    minusButton.addEventListener("click", function () {
      let value = parseInt(quantityInput.value);
      if (value > 1) {
        quantityInput.value = value - 1;
      }
    });
  }

  if (plusButton && quantityInput) {
    plusButton.addEventListener("click", function () {
      let value = parseInt(quantityInput.value);
      quantityInput.value = value + 1;
    });
  }

  // Handle variant changes
  const variantSelects = document.querySelectorAll(".variant-select");
  const variants = JSON.parse(
    document.getElementById("product-json")?.textContent || "{}"
  );
  const variantIdInput = document.querySelector("[data-variant-id]");
  const priceElement = document.querySelector("[data-product-price]");
  const availabilityElement = document.querySelector(
    "[data-variant-available]"
  );

  function updateSelectedVariant() {
    if (!variants.variants) return;

    // Get selected options
    const selectedOptions = Array.from(variantSelects).map(
      (select) => select.value
    );

    // Find matching variant
    const matchedVariant = variants.variants.find(
      (variant) =>
        JSON.stringify(variant.options) === JSON.stringify(selectedOptions)
    );

    if (matchedVariant) {
      // Update variant ID
      variantIdInput.value = matchedVariant.id;

      // Update price
      if (priceElement) {
        // Format price (simplified)
        const price = (matchedVariant.price / 100).toFixed(2);
        priceElement.innerHTML = "$" + price;
      }

      // Update availability
      if (availabilityElement) {
        if (matchedVariant.available) {
          availabilityElement.textContent = "In Stock";
          availabilityElement.classList.remove("unavailable");
        } else {
          availabilityElement.textContent = "Out of Stock";
          availabilityElement.classList.add("unavailable");
        }
      }
    }
  }

  variantSelects.forEach((select) => {
    select.addEventListener("change", updateSelectedVariant);
  });

  // AJAX add to cart
  const addToCartForm = document.querySelector("[data-product-form]");
  const addToCartButton = document.querySelector("[data-add-to-cart]");
  const formFeedback = document.querySelector("[data-form-feedback]");

  if (addToCartForm) {
    addToCartForm.addEventListener("submit", function (e) {
      e.preventDefault();

      if (addToCartButton.classList.contains("loading")) {
        return;
      }

      addToCartButton.classList.add("loading");

      fetch("/cart/add.js", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: variantIdInput.value,
          quantity: parseInt(quantityInput.value),
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.status && data.status !== 200) {
            throw new Error(data.description || "Error adding item to cart");
          }

          // Show success message
          formFeedback.textContent = "Added to cart!";
          formFeedback.className = "form-feedback success";

          // Update cart count if it exists
          updateCartCount();
        })
        .catch((error) => {
          formFeedback.textContent =
            error.message || "Error adding item to cart";
          formFeedback.className = "form-feedback error";
        })
        .finally(() => {
          addToCartButton.classList.remove("loading");

          // Hide message after 5 seconds
          setTimeout(() => {
            formFeedback.className = "form-feedback";
          }, 5000);
        });
    });
  }

  // Update cart count
  function updateCartCount() {
    fetch("/cart.js")
      .then((response) => response.json())
      .then((cart) => {
        const cartCount = document.querySelector("[data-cart-count]");
        if (cartCount) {
          cartCount.textContent = cart.item_count;
        }
      })
      .catch((error) => console.error("Error fetching cart:", error));
  }
});
