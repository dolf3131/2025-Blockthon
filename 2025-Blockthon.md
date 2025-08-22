# 2025-Blockthon DApp Workflow

This document outlines the key workflows of the donation DApp.

## 1. Campaign Creation Workflow

This diagram shows the process of a user creating a new donation campaign.

```mermaid
graph TD
    subgraph "캠페인 생성"
        A[단체/개인이 캠페인 정보 입력 후 제출] --> B[프론트엔드<br/>'create_campaign' 함수 호출];
        B --> C[스마트 컨트랙트<br/>DonationCampaign 객체 생성];
        C --> D[새로운 캠페인 DApp에 표시];
    end

    %% --- 스타일 정의 ---
    classDef defaultNode fill:#f8f8f8,stroke:#444,stroke-width:2px,font-size:15px
    
    %% --- 스타일 적용 ---
    class A,B,C,D defaultNode
```

## 2. Donation Workflow

This diagram shows the process of a user donating to a campaign and receiving an NFT.

```mermaid
graph TD
    subgraph "후원"
        A[후원자가 캠페인 선택 후<br/>금액/메시지 입력 및 제출] --> B[프론트엔드<br/>'donate' 함수 호출];
        B --> C{스마트 컨트랙트<br/>후원 조건 검증};
        C -- 성공 --> D[총 후원액 업데이트 &<br/>기념 NFT 발행/전송];
        D --> E[후원자 지갑에서 NFT 확인];
        C -- 실패 --> F[트랜잭션 실패];
    end

    %% --- 스타일 정의 ---
    classDef defaultNode fill:#f8f8f8,stroke:#444,stroke-width:2px,font-size:15px
    classDef conditionNode fill:#e9d8fd,stroke:#8e44ad,stroke-width:2px,font-size:15px

    %% --- 스타일 적용 ---
    class A,B,D,E,F defaultNode
    class C conditionNode
```

## 3. Withdrawal Workflow

This diagram shows the process of a campaign organizer withdrawing the collected funds.

```mermaid
graph TD
    subgraph "인출"
        A[생성자가 '인출하기' 실행] --> B[프론트엔드<br/>'withdraw' 함수 호출];
        B --> C{스마트 컨트랙트<br/>인출 조건 검증<br/>&#40;호출자, 목표금액 달성 여부&#41;};
        C -- 성공 --> D[수수료 계산 후<br/>생성자에게 자금 전송];
        D --> E[캠페인 비활성화];
        C -- 실패 --> F[트랜잭션 실패];
    end

    %% --- 스타일 정의 ---
    classDef defaultNode fill:#f8f8f8,stroke:#444,stroke-width:2px,font-size:15px
    classDef conditionNode fill:#e9d8fd,stroke:#8e44ad,stroke-width:2px,font-size:15px

    %% --- 스타일 적용 ---
    class A,B,D,E,F defaultNode
    class C conditionNode
```