import React, { useState, useRef, useEffect, useCallback } from 'react';
import Button from './Button';
import closeIcon from '../assets/close-icon.svg';
import '../styles/ImageCropModal.css';

export default function ImageCropModal({
  isOpen,
  imageSrc,
  cropShape = 'square',
  outputSize = 600,
  onClose,
  onCropComplete,
}) {
  const containerSize = 340;

  const [scale, setScale] = useState(1);
  const [minScale, setMinScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [naturalDim, setNaturalDim] = useState({ width: 0, height: 0 });

  const containerRef = useRef(null);
  const imageRef = useRef(null);

  // Ограничение координат смещения рамками исходного изображения
  const clampPosition = useCallback(
    (curX, curY, curScale, imgW, imgH) => {
      if (!imgW || !imgH) return { x: 0, y: 0 };

      const renderedW = imgW * curScale;
      const renderedH = imgH * curScale;

      const minX = containerSize - renderedW;
      const maxX = 0;
      const minY = containerSize - renderedH;
      const maxY = 0;

      const clampedX = Math.min(maxX, Math.max(minX, curX));
      const clampedY = Math.min(maxY, Math.max(minY, curY));

      return { x: clampedX, y: clampedY };
    },
    [containerSize]
  );

  // Загрузка изображения и вычисление стартовых масштабов и позиции
  useEffect(() => {
    if (!isOpen || !imageSrc) return;

    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      const imgWidth = img.naturalWidth;
      const imgHeight = img.naturalHeight;

      setNaturalDim({ width: imgWidth, height: imgHeight });

      const scaleToCover = Math.max(
        containerSize / imgWidth,
        containerSize / imgHeight
      );
      setMinScale(scaleToCover);
      setScale(scaleToCover);

      const initialX = (containerSize - imgWidth * scaleToCover) / 2;
      const initialY = (containerSize - imgHeight * scaleToCover) / 2;

      setPosition(
        clampPosition(initialX, initialY, scaleToCover, imgWidth, imgHeight)
      );
    };
  }, [isOpen, imageSrc, clampPosition, containerSize]);

  if (!isOpen || !imageSrc) return null;

  // Обработка начала перетаскивания курсором
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  // Обработка перемещения с ограничением координат
  const handleMouseMove = (e) => {
    if (!isDragging) return;

    const rawX = e.clientX - dragStart.x;
    const rawY = e.clientY - dragStart.y;

    const clamped = clampPosition(
      rawX,
      rawY,
      scale,
      naturalDim.width,
      naturalDim.height
    );
    setPosition(clamped);
  };

  // Завершение перетаскивания
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Изменение масштаба ползунком с сохранением центра кадрирования
  const handleScaleChange = (e) => {
    const newScale = parseFloat(e.target.value);
    const centerX = containerSize / 2;
    const centerY = containerSize / 2;

    const newX = centerX - ((centerX - position.x) / scale) * newScale;
    const newY = centerY - ((centerY - position.y) / scale) * newScale;

    setScale(newScale);
    setPosition(
      clampPosition(newX, newY, newScale, naturalDim.width, naturalDim.height)
    );
  };

  // Экспорт вырезанной области через Canvas
  const handleConfirm = () => {
    const img = imageRef.current;
    if (!img) return;

    const canvas = document.createElement('canvas');
    canvas.width = outputSize;
    canvas.height = outputSize;
    const ctx = canvas.getContext('2d');

    const ratio = outputSize / containerSize;

    ctx.drawImage(
      img,
      position.x * ratio,
      position.y * ratio,
      naturalDim.width * scale * ratio,
      naturalDim.height * scale * ratio
    );

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const croppedFile = new File([blob], 'cropped_image.webp', {
          type: 'image/webp',
        });
        const previewUrl = URL.createObjectURL(croppedFile);
        onCropComplete(croppedFile, previewUrl);
        onClose();
      },
      'image/webp',
      0.92
    );
  };

  return (
    <div
      className="modal-background image-crop-modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-window image-crop-modal-window">
        <div className="modal-window-top-buttons">
          <button type="button" className="modal-window-top-button active">
            {cropShape === 'circle'
              ? 'Выбор области аватара'
              : 'Выбор области обложки'}
          </button>
          <button
            type="button"
            className="modal-close-button"
            onClick={onClose}
            title="Закрыть"
          >
            <img src={closeIcon} alt="Закрыть" />
          </button>
        </div>

        <div className="modal-window-content">
          <p className="image-crop-hint">
            Перетаскивайте изображение мышью и используйте ползунок масштаба для
            выбора области
          </p>

          <div
            className="image-crop-viewport"
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <img
              ref={imageRef}
              src={imageSrc}
              alt="Оригинал"
              className="image-crop-source"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                transformOrigin: 'top left',
              }}
              draggable={false}
            />

            <div
              className={`image-crop-mask ${cropShape === 'circle' ? 'circle' : 'square'}`}
            />
          </div>

          <div className="image-crop-controls">
            <span className="image-crop-scale-label">Масштаб:</span>
            <input
              type="range"
              min={minScale}
              max={minScale * 3.5}
              step={0.001}
              value={scale}
              onChange={handleScaleChange}
              className="image-crop-slider"
            />
          </div>

          <div className="modal-actions-row">
            <Button type="button" variant="secondary" onClick={onClose}>
              Отмена
            </Button>
            <Button type="button" variant="primary" onClick={handleConfirm}>
              Применить
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}