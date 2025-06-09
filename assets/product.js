class ProductPage {
  constructor() {
    this.productForm = document.querySelector("[data-product-form]");

    if (!this.productForm) return;

    // Elements
    this.addToCartButton = document.querySelector("[data-add-to-cart]");
    this.quantityInput = document.querySelector("[data-quantity-input]");
    this.minusButton = document.querySelector("[data-quantity-minus]");
    this.plusButton = document.querySelector("[data-quantity-plus]");
    this.variantIdInput = document.querySelector("[data-variant-id]");
    this.variantSelectFields = document.querySelectorAll(".variant-select");
    this.variantAvailability = document.querySelector(
      "[data-variant-available]"
    );
    this.priceElement = document.querySelector("[data-product-price]");
    this.formFeedback = document.querySelector("[data-form-feedback]");

    // Data
    this.productData = JSON.parse(
      document.getElementById("product-json").textContent || "{}"
    );

    this.initEventListeners();
  }

  initEventListeners() {
    // Quantity buttons
    if (this.minusButton && this.quantityInput) {
      this.minusButton.addEventListener(
        "click",
        this.decreaseQuantity.bind(this)
      );
    }

    if (this.plusButton && this.quantityInput) {
      this.plusButton.addEventListener(
        "click",
        this.increaseQuantity.bind(this)
      );
    }

    // Variant selection
    if (this.variantSelectFields.length) {
      this.variantSelectFields.forEach((select) => {
        select.addEventListener(
          "change",
          this.updateSelectedVariant.bind(this)
        );
      });
    }

    // Form submission
    if (this.productForm) {
      this.productForm.addEventListener(
        "submit",
        this.handleAddToCart.bind(this)
      );
    }
  }

  decreaseQuantity() {
    let value = parseInt(this.quantityInput.value);
    if (value > 1) {
      this.quantityInput.value = value - 1;
    }
  }

  increaseQuantity() {
    let value = parseInt(this.quantityInput.value);
    this.quantityInput.value = value + 1;
  }

  updateSelectedVariant() {
    if (!this.productData || !this.productData.variants) return;

    // Get the selected options
    const selectedOptions = Array.from(this.variantSelectFields).map(
      (select) => select.value
    );

    // Find the matching variant
    const matchedVariant = this.productData.variants.find((variant) => {
      return variant.options.every(
        (option, index) => option === selectedOptions[index]
      );
    });

    if (matchedVariant) {
      // Update variant ID
      this.variantIdInput.value = matchedVariant.id;

      // Update price display
      if (this.priceElement) {
        this.priceElement.innerText = this.formatMoney(matchedVariant.price);
      }

      // Update availability
      if (this.variantAvailability) {
        if (matchedVariant.available) {
          this.variantAvailability.innerText = "In Stock";
          this.variantAvailability.classList.remove("unavailable");
          this.addToCartButton.disabled = false;
        } else {
          this.variantAvailability.innerText = "Out of Stock";
          this.variantAvailability.classList.add("unavailable");
          this.addToCartButton.disabled = true;
        }
      }

      // Update URL with variant ID
      if (history.replaceState) {
        const url = new URL(window.location.href);
        url.searchParams.set("variant", matchedVariant.id);
        window.history.replaceState(
          { path: url.toString() },
          "",
          url.toString()
        );
      }
    }
  }

  handleAddToCart(event) {
    event.preventDefault();

    if (this.addToCartButton.classList.contains("loading")) {
      return;
    }

    this.addToCartButton.classList.add("loading");

    const formData = new FormData(this.productForm);

    fetch("/cart/add.js", {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.status && data.status !== 200) {
          throw new Error(data.description || "Error adding product to cart");
        }

        // Show success message
        this.showFormFeedback("Product added to cart!", "success");

        // Update cart count
        this.updateCartCount();

        // Open cart drawer if it exists
        if (typeof openCart === "function") {
          setTimeout(openCart, 500);
        }
      })
      .catch((error) => {
        this.showFormFeedback(
          error.message || "Error adding product to cart",
          "error"
        );
        console.error("Error:", error);
      })
      .finally(() => {
        this.addToCartButton.classList.remove("loading");
      });
  }

  showFormFeedback(message, type = "success") {
    if (!this.formFeedback) return;

    this.formFeedback.innerText = message;
    this.formFeedback.className = `form-feedback ${type}`;

    setTimeout(() => {
      this.formFeedback.style.display = "none";
      this.formFeedback.className = "form-feedback";
    }, 5000);
  }

  updateCartCount() {
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

  formatMoney(cents) {
    const format = "{{ shop.money_format }}";
    if (typeof cents === "string") cents = cents.replace(".", "");
    let value = "";
    const placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
    const formatString = format || "₹{{amount}}";

    function formatWithDelimiters(number, precision, thousands, decimal) {
      thousands = thousands || ",";
      decimal = decimal || ".";

      if (isNaN(number) || number === null) {
        return 0;
      }

      number = (number / 100.0).toFixed(precision);

      const parts = number.split(".");
      const dollars = parts[0].replace(
        /(\d)(?=(\d\d\d)+(?!\d))/g,
        "$1" + thousands
      );
      const cents = parts[1] ? decimal + parts[1] : "";

      return dollars + cents;
    }

    switch (formatString.match(placeholderRegex)[1]) {
      case "amount":
        value = formatWithDelimiters(cents, 2);
        break;
      case "amount_no_decimals":
        value = formatWithDelimiters(cents, 0);
        break;
      case "amount_with_comma_separator":
        value = formatWithDelimiters(cents, 2, ".", ",");
        break;
      case "amount_no_decimals_with_comma_separator":
        value = formatWithDelimiters(cents, 0, ".", ",");
        break;
      case "amount_with_space_separator":
        value = formatWithDelimiters(cents, 2, " ", ".");
        break;
    }

    return formatString.replace(placeholderRegex, value);
  }
}

// Initialize product page
document.addEventListener("DOMContentLoaded", () => {
  new ProductPage();
});

// Image gallery functionality
function updateMainImage(thumbnail) {
  const mainImage = document.getElementById("main-product-image");
  const fullImageUrl = thumbnail.dataset.fullImg;
  const thumbnails = document.querySelectorAll(".thumbnail-item");

  // Update main image
  mainImage.src = fullImageUrl;
  mainImage.parentNode.classList.add("loading");

  // Update active thumbnail
  thumbnails.forEach((item) => item.classList.remove("active"));
  thumbnail.parentNode.classList.add("active");

  // Remove loading class when image is loaded
  mainImage.onload = () => {
    mainImage.parentNode.classList.remove("loading");
  };
}
