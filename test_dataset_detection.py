"""
Test script to verify PlantVillage dataset detection and structure.
Run this before training to ensure everything is set up correctly.
"""

import os
import sys
from pathlib import Path

def test_dataset_structure():
    """Test if the PlantVillage dataset is properly structured."""
    print("🔍 Testing PlantVillage Dataset Detection")
    print("=" * 50)
    
    project_root = Path(__file__).parent
    
    # Test 1: Check if data folder exists
    data_dir = project_root / "data"
    print(f"\n1️⃣ Checking data folder...")
    if data_dir.exists():
        print(f"✅ Data folder found: {data_dir}")
    else:
        print(f"❌ Data folder not found: {data_dir}")
        return False
    
    # Test 2: Check if plantvillage dataset exists
    plantvillage_dir = data_dir / "plantvillage dataset"
    print(f"\n2️⃣ Checking PlantVillage dataset folder...")
    if plantvillage_dir.exists():
        print(f"✅ PlantVillage folder found: {plantvillage_dir}")
    else:
        print(f"❌ PlantVillage folder not found: {plantvillage_dir}")
        return False
    
    # Test 3: Check if color folder exists
    color_dir = plantvillage_dir / "color"
    print(f"\n3️⃣ Checking color images folder...")
    if color_dir.exists():
        print(f"✅ Color folder found: {color_dir}")
    else:
        print(f"❌ Color folder not found: {color_dir}")
        return False
    
    # Test 4: Check disease classes
    print(f"\n4️⃣ Analyzing disease classes...")
    disease_classes = [d for d in color_dir.iterdir() if d.is_dir()]
    
    if len(disease_classes) == 0:
        print("❌ No disease classes found!")
        return False
    
    print(f"✅ Found {len(disease_classes)} disease classes")
    
    # Test 5: Count images per class
    print(f"\n5️⃣ Counting images per class...")
    class_info = {}
    total_images = 0
    
    for disease_class in disease_classes:
        image_extensions = ['*.jpg', '*.jpeg', '*.png', '*.JPG', '*.JPEG', '*.PNG']
        images = []
        for ext in image_extensions:
            images.extend(list(disease_class.glob(ext)))
        
        class_info[disease_class.name] = len(images)
        total_images += len(images)
    
    print(f"✅ Total images found: {total_images:,}")
    
    # Show top 10 classes
    sorted_classes = sorted(class_info.items(), key=lambda x: x[1], reverse=True)
    print(f"\n📊 Top 10 disease classes by image count:")
    for i, (class_name, count) in enumerate(sorted_classes[:10]):
        print(f"  {i+1:2d}. {class_name:<50} {count:,} images")
    
    # Test 6: Check for common issues
    print(f"\n6️⃣ Checking for potential issues...")
    
    # Check for classes with very few images
    small_classes = [(name, count) for name, count in class_info.items() if count < 100]
    if small_classes:
        print(f"⚠️ Classes with < 100 images:")
        for name, count in small_classes:
            print(f"    {name}: {count} images")
    else:
        print("✅ All classes have sufficient images (≥100)")
    
    # Check for very large classes that might cause imbalance
    large_classes = [(name, count) for name, count in class_info.items() if count > 3000]
    if large_classes:
        print(f"⚠️ Very large classes (might cause imbalance):")
        for name, count in large_classes:
            print(f"    {name}: {count} images")
    
    # Test 7: Sample a few images to verify they're valid
    print(f"\n7️⃣ Testing sample images...")
    sample_class = disease_classes[0]
    sample_images = list(sample_class.glob("*.jpg"))[:3]
    
    if sample_images:
        print(f"✅ Sample images from {sample_class.name}:")
        for img in sample_images:
            size_mb = img.stat().st_size / (1024 * 1024)
            print(f"    {img.name} ({size_mb:.2f} MB)")
    else:
        print(f"⚠️ No .jpg images found in {sample_class.name}")
    
    print(f"\n🎉 Dataset structure test completed!")
    print(f"📊 Summary:")
    print(f"   • Disease classes: {len(disease_classes)}")
    print(f"   • Total images: {total_images:,}")
    print(f"   • Average per class: {total_images // len(disease_classes):,}")
    print(f"   • Dataset ready for training: ✅")
    
    return True

def test_dependencies():
    """Test if required dependencies are installed."""
    print(f"\n🔧 Testing Dependencies")
    print("=" * 30)
    
    required_packages = [
        'tensorflow',
        'opencv-python', 
        'PIL',
        'numpy',
        'pathlib'
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            if package == 'opencv-python':
                import cv2
                print(f"✅ OpenCV: {cv2.__version__}")
            elif package == 'PIL':
                from PIL import Image
                print(f"✅ Pillow (PIL): Available")
            else:
                module = __import__(package)
                if hasattr(module, '__version__'):
                    print(f"✅ {package}: {module.__version__}")
                else:
                    print(f"✅ {package}: Available")
        except ImportError:
            print(f"❌ {package}: Not installed")
            missing_packages.append(package)
    
    if missing_packages:
        print(f"\n⚠️ Missing packages: {', '.join(missing_packages)}")
        print(f"Install with: pip install {' '.join(missing_packages)}")
        return False
    else:
        print(f"\n✅ All dependencies are installed!")
        return True

def main():
    """Main test function."""
    print("🧪 Krishi Mitra - Dataset & Dependencies Test")
    print("=" * 60)
    
    # Test dataset structure
    dataset_ok = test_dataset_structure()
    
    # Test dependencies
    deps_ok = test_dependencies()
    
    print(f"\n" + "=" * 60)
    print(f"📋 TEST RESULTS:")
    print(f"   Dataset Structure: {'✅ PASS' if dataset_ok else '❌ FAIL'}")
    print(f"   Dependencies: {'✅ PASS' if deps_ok else '❌ FAIL'}")
    
    if dataset_ok and deps_ok:
        print(f"\n🎉 All tests passed! Ready to train the model.")
        print(f"\n🚀 Next step: Run the training script")
        print(f"   Command: python scripts/train_disease_model.py")
    else:
        print(f"\n⚠️ Some tests failed. Please fix the issues above before training.")
    
    print("=" * 60)

if __name__ == "__main__":
    main()
